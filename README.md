# SnipVault — Code Snippet Manager

SnipVault is a code snippet manager with syntax highlighting, tagging, and search. Pro tier unlocks unlimited snippets via Stripe billing.

## Billing Model

| Tier | Lookup Key (target) |
|------|-------------|
| **Free** | — |
| **Pro** | `snipvault.pro.monthly` |

### Entity Model
- **Billing attaches to: User**
- `stripeCustomerId`, `stripeSubscriptionId` on users table
- Plan tier (free/pro) on user record

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router), TypeScript |
| Database | PostgreSQL (Neon), Drizzle ORM |
| Billing | Stripe (checkout, webhooks, billing portal) |

## Stripe Integration

- **Webhook endpoint:** `/api/webhooks/stripe`
- **Events:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- **Env vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRO_PRICE_ID`

### Stripe Setup
1. Create a Stripe product with a recurring price
2. Set `STRIPE_PRO_PRICE_ID` in your environment (migrating to lookup key `snipvault.pro.monthly`)
3. Configure webhook endpoint at `/api/webhooks/stripe` for the events listed above
4. Set `STRIPE_WEBHOOK_SECRET` from the Stripe Dashboard

## Migration Status (LexCorp Phase 7)
- [ ] Migrate env var price ID to `snipvault.pro.monthly` lookup key
- [ ] Add registry-required metadata: `project`, `environment`, `entityType`, `appUrl`, `priceLookupKey`

## Development

```bash
npm install
cp .env.example .env.local
npm run db:push
npm run dev
```
