# bachs-skill

A Claude Code **skill** for integrating [Bachs](https://bachs.io) payments
and recurring subscriptions — real, working TypeScript implementation (not
just docs), built from Bachs's actual OpenAPI spec.

The skill itself lives at [`skills/bachs-payments/`](skills/bachs-payments/):

- [`SKILL.md`](skills/bachs-payments/SKILL.md) — what Claude reads to know when/how to use this
- [`src/`](skills/bachs-payments/src/) — a zero-dependency, fetch-based Bachs API client (products, customers, checkout sessions, subscriptions, webhook verification)
- [`examples/`](skills/bachs-payments/examples/) — a full Hono webhook/checkout integration, and the recommended "effective plan" lazy-expiry pattern for recurring access
- [`references/`](skills/bachs-payments/references/) — condensed API reference, webhook signature verification detail, account-gating/currency limitations, and a subscriptions implementation guide

## Install the skill

See [`INSTALL.md`](INSTALL.md).

## Use the client code directly (without the skill)

`skills/bachs-payments/src/` is plain TypeScript with no dependencies beyond
a global `fetch` (Bun, Node 18+, Deno, Cloudflare Workers, browsers all
qualify) — you can copy it straight into any project:

```ts
import { Bachs, constructWebhookEvent } from "./src";

const bachs = new Bachs({ apiKey: process.env.BACHS_SECRET_KEY! });

const session = await bachs.checkoutSessions.create({
  customer: { email: "jane@example.com" },
  product_cart: [{ product_id: "prod_abc123" }],
  success_url: "https://app.example.com/billing/success",
});
// redirect the user to session.checkout_url
```

## Before you integrate subscriptions specifically

Bachs gates recurring **Subscriptions** behind account approval
(`SUBSCRIPTIONS_NOT_ENABLED` until you email support@bachs.xyz), and
recurring billing is currently **USD-only** (NGN/other-currency recurring is
"rolling out"). One-time checkouts are not affected. Full detail in
[`skills/bachs-payments/references/gating-and-limitations.md`](skills/bachs-payments/references/gating-and-limitations.md).

## License

MIT — see [`LICENSE`](LICENSE).
