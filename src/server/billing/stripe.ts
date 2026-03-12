import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

export const PLAN_LIMITS = {
  free: {
    snippetLimit: 100,
    aiTagging: false,
    semanticSearch: false,
    ideExtension: false,
    gistImport: false,
  },
  pro: {
    snippetLimit: Infinity,
    aiTagging: true,
    semanticSearch: true,
    ideExtension: true,
    gistImport: true,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as PlanType] ?? PLAN_LIMITS.free;
}

export function canUseFeature(plan: string, feature: keyof (typeof PLAN_LIMITS)['pro']): boolean {
  const limits = getPlanLimits(plan);
  return !!limits[feature];
}
