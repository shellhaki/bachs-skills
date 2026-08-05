# Bachs webhooks

## Signature verification (do this — always)

Every delivery includes:

| Header              | Value                                              |
|----------------------|-----------------------------------------------------|
| `X-Bachs-Timestamp`  | Unix timestamp (seconds) of when the event was sent |
| `X-Bachs-Signature`  | HMAC-SHA256 hex digest of `"{timestamp}.{raw_body}"` |

Verify by reconstructing `${timestamp}.${raw_body}`, computing HMAC-SHA256
with the endpoint's signing secret (`whsec_...`), and comparing to the
signature header with a constant-time comparison. Also reject deliveries
whose timestamp is too far from "now" (replay protection) — 300 seconds is
Bachs' own example tolerance.

**You must verify the raw request body, before any JSON parsing** —
`JSON.parse` then `JSON.stringify` does not reproduce the exact bytes that
were signed (whitespace/key-order can differ).

This skill implements this in `src/webhooks.ts` as
`constructWebhookEvent(rawBody, headers, signingSecret)` — throws if the
signature is missing, malformed, stale, or doesn't match; returns the parsed
event on success. Never process a webhook payload you haven't verified.

> The current SparkDB `handleWebhook` (Paystack-based,
> `server/src/features/billing/billing.controller.ts`) does **zero**
> signature verification today — that's a real hole (anyone can forge a
> `charge.success` event and upgrade any account for free). Whichever
> provider SparkDB ends up wired to, that must be fixed; `constructWebhookEvent`
> here is the pattern to port over.

## The signing secret

Returned **once**, in the `POST /v1/webhooks/endpoints` create response (or
`.../rotate-secret`). Not retrievable in full afterward — view it (masked,
revealable) in the dashboard, or rotate to get a new one. Store it in an env
var the moment you get it.

## Event types

```
collection.succeeded          collection.failed          collection.underpaid
checkout.completed            checkout.expired
payout.created                payout.paid                payout.failed
refund.created                refund.paid                refund.failed
conversion.completed          conversion.failed
customer.created               customer.updated
dispute.created                 dispute.updated
customer.subscription.created  customer.subscription.updated  customer.subscription.deleted
invoice.created                 invoice.paid                   invoice.payment_failed
```

For subscription billing you almost always want:
`customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`, and optionally `invoice.payment_failed` if
you want to show a "past due" banner before Bachs' own dunning resolves it.

`customer.subscription.updated` fires on *every* subscription change —
renewal (new `current_period_end`), plan change, `cancel_at_period_end`
being set, status moving to `past_due`, etc. You generally don't need to
distinguish sub-cases: just re-persist `status`, `current_period_end`, and
`cancel_at_period_end` from `event.data` every time and let the "effective
plan" read pattern (`references/subscriptions-guide.md`) handle the rest.

## Registering an endpoint

```ts
const endpoint = await bachs.webhookEndpoints.create({
  name: "Production",
  url: "https://api.sparkdb.pro/billing/webhook",
  event_types: [
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_failed",
  ],
});
// endpoint.signing_secret — store this now, e.g. BACHS_WEBHOOK_SECRET
```

You can also create/manage endpoints from the Bachs dashboard — both paths
produce the same endpoint with the same signing secret.
