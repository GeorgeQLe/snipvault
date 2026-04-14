# Manual Todo — SnipVault

> Context: LexCorp Phase 7 — Portfolio Billing Operating Model

## Stripe Migration (Phase 7.7)

- [ ] Migrate `STRIPE_PRO_PRICE_ID` env var to `snipvault.pro.monthly` lookup key
- [ ] Add metadata contract to checkout sessions: `project`, `environment`, `entityType`, `entityId`, `appUrl`, `priceLookupKey`
- [ ] Add `metadata.project: "snipvault"` to Customer creation

## Stripe Dashboard

- [ ] Create products with namespaced lookup keys per registry
- [ ] Configure webhook endpoint restricted to required events
