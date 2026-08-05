# Account gating & current limitations (read this before integrating)

## Subscriptions are "Limited Access"

Bachs's docs mark the Subscriptions section with a `Limited Access` badge:
it is **not enabled by default** on a new account. Calling any subscription
endpoint on an unapproved account returns:

| Error code                     | HTTP | Meaning                                                                    |
|---------------------------------|------|-----------------------------------------------------------------------------|
| `SUBSCRIPTIONS_NOT_ENABLED`     | 403  | Subscriptions are not enabled for this account. Contact support to request access. |
| `NGN_SUBSCRIPTIONS_NOT_ENABLED` | 403  | NGN subscriptions specifically are not enabled. Contact support to request access.  |
| `TRIALS_NOT_ENABLED`            | 403  | Trials are not enabled for this account. Contact support to request access.         |

**Action required before this skill's subscription code will actually work
end-to-end:** email `support@bachs.xyz` and request Subscriptions access for
your account/organization. This is separate from just having API keys —
sandbox keys alone are not sufficient to unlock this.

Payouts and Quotes (FX conversion) are similarly gated as `Limited Access`;
not relevant to a checkout+subscriptions integration.

## Currency limitation: USD-only recurring billing today

> "Subscriptions currently bill USD cards only. Recurring billing on other
> rails and currencies is rolling out."

This means: **NGN recurring subscriptions are not currently available**,
even once Subscriptions access is granted, unless/until Bachs finishes
rolling that out (also separately gated behind
`NGN_SUBSCRIPTIONS_NOT_ENABLED`). One-time NGN payments (via Checkout
Sessions with a non-recurring product, or a `pricing`-only checkout) are
unaffected — this limitation is specific to *recurring* billing.

Practical implication for a product currently pricing plans in NGN (e.g.
SparkDB's existing Paystack `PRICING` table has separate USD/NGN tiers):
until Bachs enables NGN subscriptions, real recurring plans can only be
billed in USD. Options:
1. Launch subscriptions USD-only now, keep NGN as a display/reference
   currency only (convert at checkout time via Bachs's currency_options on
   the product, or just don't offer NGN cards a subscription checkout yet).
2. Wait for NGN subscription support before launching recurring billing.

This is a business decision, not a technical one this skill can make for
you — flag it explicitly when wiring this into a real product.

## API keys

- `sk_sandbox_...` — testing, no real money moves. Use for local dev / CI.
- `sk_live_...` — production. Requires business verification/approval before
  Bachs issues one.

Keys are scoped (e.g. `products:read`, `products:write`,
`subscriptions:read`, `webhooks:write`). Create a key with only the scopes
your integration actually needs.
