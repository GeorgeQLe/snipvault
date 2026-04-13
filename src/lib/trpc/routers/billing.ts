import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const PRO_LOOKUP_KEY = 'snipvault.pro.monthly';

export const PLANS = {
  free: {
    name: 'Free',
    snippetLimit: 100,
    features: ['100 snippets', 'Keyword search', 'Basic organization', 'Manual tagging'],
    price: 0,
  },
  pro: {
    name: 'Pro',
    snippetLimit: Infinity,
    features: [
      'Unlimited snippets',
      'AI auto-tagging',
      'Semantic search',
      'VS Code extension',
      'GitHub Gist import',
      'Priority support',
    ],
    price: 800, // cents
    lookupKey: PRO_LOOKUP_KEY,
  },
} as const;

/** Resolve the Stripe price ID for the Pro plan via lookup key. */
async function resolveProPriceId(): Promise<string> {
  const prices = await stripe.prices.list({
    lookup_keys: [PRO_LOOKUP_KEY],
    limit: 1,
  });
  const price = prices.data[0];
  if (!price) {
    throw new Error(`No Stripe price found for lookup key "${PRO_LOOKUP_KEY}"`);
  }
  return price.id;
}

export const billingRouter = router({
  /**
   * Get current plan info.
   */
  currentPlan: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
    });

    const plan = user?.plan === 'pro' ? 'pro' : 'free';

    return {
      plan,
      ...PLANS[plan],
      stripeSubscriptionId: user?.stripeSubscriptionId,
    };
  }),

  /**
   * Create a Stripe Checkout session for Pro upgrade.
   */
  createCheckout: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
    });

    if (!user) throw new Error('User not found');

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id, project: 'snipvault' },
      });
      customerId = customer.id;
      await ctx.db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, user.id));
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const priceId = await resolveProPriceId();

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          project: 'snipvault',
          environment: process.env.NODE_ENV || 'development',
          entityType: 'user',
          entityId: user.id,
          appUrl: 'https://snipvault.dev',
          priceLookupKey: PRO_LOOKUP_KEY,
        },
      },
      success_url: `${appUrl}/billing?success=true`,
      cancel_url: `${appUrl}/billing?canceled=true`,
      metadata: { userId: user.id },
    });

    return { url: session.url };
  }),

  /**
   * Create a Stripe Customer Portal session.
   */
  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
    });

    if (!user?.stripeCustomerId) {
      throw new Error('No billing account found');
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/billing`,
    });

    return { url: session.url };
  }),
});
