# Bachs API reference (condensed)

Source of truth: `https://docs.bachs.io/docs/openapi/openapi.json` (the real
spec — **not** `https://docs.bachs.io/api-reference/openapi.json`, which
returns Mintlify's unrelated demo "Plant Store" stub). Base URL for all
requests: `https://api.bachs.io`.

Auth: `Authorization: Bearer sk_sandbox_...` (testing) or `sk_live_...`
(production, requires business verification). Keys are scoped
(`products:read`/`write`, subscription scopes, `webhooks:write`, etc.) —
create a key with only the scopes you need.

## Products

Products are the only "plan" concept on Bachs — there's no separate
subscription-plan object. A product is recurring *iff* it has a
`billing_cycle`; omit that field for a one-time product.

`POST /v1/products`
```json
{
  "name": "Pro Plan",
  "description": "Monthly access to all Pro features.",
  "price": { "currency": "USD", "amount": "29.00" },
  "billing_cycle": { "interval": "month", "frequency": 1 }
}
```
Returns a `ProductResponse` with `id` (`prod_...`), echoing back `price`,
`billing_cycle`, `status`, `metadata`.

`GET /v1/products`, `GET /v1/products/{id}`, `DELETE /v1/products/{id}` (archives, doesn't hard-delete).

## Checkout sessions

`POST /v1/checkout-sessions` — the entry point for both one-time and
recurring payments. There is **no** separate "create subscription" endpoint:
put a recurring product in `product_cart` and completing this checkout
auto-creates the Subscription.

```json
{
  "customer": { "email": "jane@example.com", "name": "Jane Doe" },
  "product_cart": [{ "product_id": "prod_abc123" }],
  "success_url": "https://app.example.com/billing/success",
  "cancel_url": "https://app.example.com/billing",
  "reference": "user_42"
}
```
`customer` accepts either a new customer (`email` required) or
`{ "customer_id": "cus_..." }` for an existing one. `reference` is your own
unique correlation id (auto-generated if omitted) — set it so webhooks can be
matched back to your own user without an email lookup.

Response: `{ checkout_id, checkout_url, status, expires_at, created_at, reference }`.
Redirect the customer to `checkout_url`; Bachs redirects back to
`success_url` with `?checkout_id=<id>` appended on completion.

## Subscriptions <Badge>Limited Access</Badge>

**Subscriptions must be enabled for your account before any of this works.**
See `references/gating-and-limitations.md`.

- `GET /v1/subscriptions` — list
- `GET /v1/subscriptions/{subscription_id}` — fetch one
- `PATCH /v1/subscriptions/{subscription_id}` — send exactly **one** intent
  per call (`product_id` to change plan, `trial_end` to move a trial,
  `payment_method_id` to swap card, or `metadata`). Combining more than one
  in a single request returns 400.
  - Plan changes also take `proration_behavior`: `invoice_now` (default),
    `next_cycle`, or `none`.
- `DELETE /v1/subscriptions/{subscription_id}` — cancel. Body:
  `{ "cancel_at_period_end": true, "reason": "Customer requested" }`.
  `cancel_at_period_end: true` keeps access until `current_period_end` (the
  status stays `active` with `cancel_at_period_end` flipped until then);
  `false` (default) cancels immediately.

Key fields on the `Subscription` object: `id`, `status`
(`active`/`past_due`/`unpaid`/`canceled`/`trialing`), `current_period_start`,
`current_period_end`, `next_billed_at`, `cancel_at_period_end`,
`canceled_at`, `product`, `items[]`.

## Customers

`POST /v1/customers` — `{ email (required), name?, phone_number? (E.164), billing_address?, metadata? }`.

`POST /v1/customers/{customer_id}/portal-sessions` — creates a hosted,
self-service Customer Portal session (`{ id, url }`). Send the customer to
`url` for cancel / card-update / invoice-history — you don't have to build
that UI yourself.

## Webhooks

See `references/webhooks.md` for signature verification and the full event
list. Management endpoints (`webhooks:write` scope):
`POST/GET /v1/webhooks/endpoints`, `GET/PATCH/DELETE
/v1/webhooks/endpoints/{id}`, `POST .../rotate-secret`, `GET .../events`,
`GET /v1/webhooks/events`.

## Full endpoint inventory (59 paths, from the OpenAPI spec)

Grouped by resource — see the spec for request/response shapes not covered
above (payouts, conversions/FX quotes, disputes, refunds, and payment-method
management are all "Limited Access" or advanced-use and not implemented in
this skill's `src/`, but the client's `BachsHttp` methods can call any of
them directly, e.g. `http.get("/v1/payouts")`).

- `accounts`, `organizations`
- `products` (CRUD)
- `checkout-sessions` (create, get)
- `customers` (CRUD), `customers/{id}/portal-sessions`
- `subscriptions` (list, get, patch, delete)
- `payments`, `refunds`
- `payment-methods`
- `payouts` (Limited Access)
- `conversions`, `currencies` (FX quotes — Limited Access)
- `disputes`
- `product-groups`
- `webhooks/endpoints` + sub-resources (events, metrics, secret, replay)
- `utilities`/uploads
