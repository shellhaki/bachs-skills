---
name: bachs-payments
description: Integrate Bachs (bachs.io) payments and recurring subscriptions — checkout sessions, products/plans, subscription lifecycle (create/update/cancel), customer portal, and HMAC webhook verification. Use whenever the user wants to add Bachs payments, recurring billing, or subscription checkout to a project, or asks about the Bachs API.
---

# Bachs payments & subscriptions

Real, working TypeScript implementation for integrating Bachs
(`https://bachs.io`) — a payments/billing platform (cards, mobile money,
bank transfer, stablecoin, 150+ currencies) — including recurring
subscriptions. Built from Bachs's actual OpenAPI spec
(`https://docs.bachs.io/docs/openapi/openapi.json`), not just the prose docs.

## When to use this skill

- Adding "Upgrade to Pro" / checkout / paywall flows backed by Bachs.
- Implementing recurring subscriptions (create, cancel, change plan, dunning-aware status).
- Verifying Bachs webhooks correctly (HMAC-SHA256 signature check).
- Answering questions about Bachs API shapes, gating, or limitations.

## First, read this if the task involves subscriptions specifically

Bachs gates Subscriptions behind account approval, and recurring billing is
currently USD-only. **Read `references/gating-and-limitations.md` before
promising a user working recurring billing** — they likely need to email
`support@bachs.xyz` first, and NGN (or other non-USD) recurring subscriptions
are not available yet. One-time (non-recurring) checkouts are not gated.

## What's included

```
src/            Real fetch-based TypeScript client (Bun/Node 18+, zero deps)
  types.ts        Request/response types hand-written from the OpenAPI spec
  client.ts       BachsHttp — thin fetch wrapper (auth header, error mapping)
  products.ts     create/get/list/archive — a recurring product IS the plan
  customers.ts    create/get/list + createPortalSession
  checkout-sessions.ts   create/get — the entry point for both one-time & subscription checkout
  subscriptions.ts       get/list/update/cancel
  webhooks.ts     constructWebhookEvent() — verified HMAC signature check + endpoint management
  index.ts        Bachs client class that wires all of the above together

examples/
  hono-integration.ts   Full checkout + portal + webhook routes wired into Hono
  effective-plan.ts     Lazy-expiry pattern for computing a user's current plan

references/       Loaded on demand — don't read all of these up front
  api-reference.md            Condensed endpoint reference (all 59 paths)
  webhooks.md                 Signature verification detail + event type list
  gating-and-limitations.md   Subscriptions Limited-Access gating, USD-only limitation
  subscriptions-guide.md      Recommended DB schema, lazy-expiry pattern, cancel UX, plan changes
```

## Quick start

1. Get an API key from the Bachs dashboard: `sk_sandbox_...` for testing.
2. `import { Bachs } from "./src"` (copy `src/` into the target project, or
   reference it directly — see `INSTALL.md` at the repo root for both options).
3. Create a recurring product once (script, not per-request):
   ```ts
   const bachs = new Bachs({ apiKey: process.env.BACHS_SECRET_KEY! });
   const plan = await bachs.products.create({
     name: "Pro Plan",
     price: { currency: "USD", amount: "29.00" },
     billing_cycle: { interval: "month", frequency: 1 },
   });
   // store plan.id somewhere (config/constants), you'll reference it at checkout
   ```
4. Start a checkout for a user — see `examples/hono-integration.ts`.
5. Register a webhook endpoint and verify deliveries with
   `constructWebhookEvent` — see `references/webhooks.md`.
6. For the full subscription lifecycle (cancel-at-period-end, plan changes,
   computing effective access), read `references/subscriptions-guide.md`.

## Design choices (why the code looks like this)

- **No SDK dependency** — a single `fetch`-based `BachsHttp` class. Bachs
  doesn't publish an official Node SDK; this avoids depending on an
  unofficial one and keeps the code auditable in one file.
- **Types are hand-written from the real OpenAPI spec's `components.schemas`**
  (fetched from `docs.bachs.io/docs/openapi/openapi.json`), not guessed from
  prose docs — field names/shapes match actual API responses.
- **Webhook verification is a standalone pure function** (`constructWebhookEvent`)
  so it can be unit-tested with a fixed timestamp/body/secret without any
  network access.
- Kept deliberately simple: no retry/backoff, no pagination helpers beyond
  what the API returns directly — add those at the call site if a specific
  integration needs them.
