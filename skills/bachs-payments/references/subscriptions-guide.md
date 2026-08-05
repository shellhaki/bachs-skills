# Implementing recurring subscriptions with Bachs

## Model

Bachs has no separate "plan" object — a recurring **Product** *is* the plan.
Create one product per plan tier (e.g. `Plus`, `Pro`, `Max`), each with a
`billing_cycle`. A Checkout Session against a recurring product
auto-creates a Subscription on completion; there's no separate "subscribe"
API call.

```
Product (recurring)  --checkout-session-completes-->  Subscription (auto-created)
```

## Recommended DB schema addition

Add to your `users` table (or a separate `subscriptions` table if one user
can have multiple):

```sql
ALTER TABLE users
  ADD COLUMN bachs_customer_id TEXT,
  ADD COLUMN bachs_subscription_id TEXT,
  ADD COLUMN current_period_end TIMESTAMPTZ,
  ADD COLUMN cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;
-- `sub` (the plan tier enum) already exists — keep using it as the
-- "last known tier from Bachs", not as the literal current-access flag.
```

## The lazy-expiry "effective plan" pattern (recommended)

Don't eagerly downgrade `sub` to `free` from a cron job or on every webhook.
Instead compute access **at read time** from `sub` + `current_period_end`:

```ts
function getEffectivePlan(user) {
  if (user.sub === "free") return "free";
  if (!user.current_period_end) return "free";
  if (user.current_period_end.getTime() < Date.now()) return "free";
  return user.sub;
}
```

This one function correctly handles:
- **Cancellation with remaining access** (`cancel_at_period_end: true`) —
  `sub` and `current_period_end` are untouched until the
  `customer.subscription.deleted` event actually fires at period end, so
  access naturally continues until then with zero extra logic.
- **Payment failure** — during Bachs's dunning retries the subscription
  stays `past_due`/`active` with the old `current_period_end` until either a
  retry succeeds (new `customer.subscription.updated` with a fresh
  `current_period_end`) or dunning exhausts and Bachs cancels it
  (`customer.subscription.deleted`) — at which point `current_period_end`
  stops being extended and access lapses on its own the moment "now" passes it.
- **Renewal** — every successful renewal charge produces a
  `customer.subscription.updated` event with a new `current_period_end`;
  just overwrite the stored value.

See `../examples/effective-plan.ts` for a drop-in implementation.

## Webhook handler responsibility

Your webhook handler (`../examples/hono-integration.ts`) only needs to do
one thing on `customer.subscription.created` / `.updated` / `.deleted`:
overwrite `bachs_subscription_id`, `sub` (mapped from `event.data.product.id`
or `product.metadata.tier`), `current_period_end`, and
`cancel_at_period_end` on the matching user row. No branching logic needed
beyond that — `getEffectivePlan` does the rest at read time.

Match the event back to a user via `event.data.customer_id` (looked up
against your stored `bachs_customer_id`) — set that at checkout time by
passing `reference: "user_<id>"` and/or `metadata: { user_id }` on the
Checkout Session, and store the resulting `customer_id` from the first
`customer.subscription.created` event.

## Cancellation UX

`cancel_at_period_end: true` (recommended default) — user keeps access
until the period they already paid for ends, matches "cancel anytime, keep
access until renewal" expectations. Expose this as the primary cancel
button; only offer immediate cancellation (`false`) if you have a specific
reason to (e.g. refund-and-revoke flows).

Prefer sending users to the **Customer Portal**
(`bachs.customers.createPortalSession`) for cancel/card-update/invoices
rather than building that UI yourself — it's hosted by Bachs and stays in
sync with their dunning/retry logic automatically.

## Plan changes (upgrade/downgrade)

`PATCH /v1/subscriptions/{id}` with `product_id` (new plan) +
`proration_behavior`:
- `invoice_now` (default) — charge/credit the difference immediately.
- `next_cycle` — apply the new price starting next period, no immediate charge.
- `none` — swap plans with no proration at all.

## Before any of this works: read `gating-and-limitations.md`

Subscriptions are `Limited Access` on Bachs — you must email
support@bachs.xyz to enable them on your account first, and recurring
billing is USD-only today (NGN recurring is not yet available).
