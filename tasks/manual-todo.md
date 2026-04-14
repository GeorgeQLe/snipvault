# Manual Tasks — SnipVault

> Updated: 2026-04-14
> Source of truth for Stripe config: `stripe-registry.yaml` in lexcorp-war-room

## Phase 7: Portfolio Billing Operating Model (LexCorp)

### Completed (code migration)
- [x] Migrated `STRIPE_PRO_PRICE_ID` env var to `snipvault.pro.monthly` lookup key
- [x] Added metadata contract to checkout sessions: `project`, `environment`, `entityType`, `entityId`, `plan`, `appUrl`, `priceLookupKey`
- [x] Added `metadata.project: "snipvault"` to Customer creation

### Remaining — Stripe Dashboard
- [ ] Create "SnipVault Pro" product in Stripe Dashboard
  - [ ] Add price with lookup key `snipvault.pro.monthly` ($8.00/mo)
  - [ ] Add price with lookup key `snipvault.pro.yearly` ($64.00/yr)
- [ ] Configure webhook endpoint: `https://snipvault.dev/api/webhooks/stripe`
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
  - Payload: snapshot, API version: `2025-03-31.basil`
- [ ] Pin Stripe API version to `2025-03-31.basil`
- [ ] Remove `STRIPE_PRO_PRICE_ID` from env config (replaced by lookup key)
