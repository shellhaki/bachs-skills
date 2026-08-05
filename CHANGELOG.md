# Changelog

## 2026-08-05 — Initial release

- New repo, built as a Claude Code skill (`skills/bachs-payments/`).
- Real fetch-based TypeScript client (`src/`) covering products, customers,
  checkout sessions, subscriptions (get/list/update/cancel), customer
  portal sessions, and webhook endpoint management — types hand-written
  from Bachs's real OpenAPI spec (`docs.bachs.io/docs/openapi/openapi.json`).
- Webhook signature verification (`constructWebhookEvent`) implementing
  Bachs's documented HMAC-SHA256 scheme (`X-Bachs-Timestamp` +
  `X-Bachs-Signature` over `"{timestamp}.{raw_body}"`), with replay/timestamp
  tolerance and constant-time comparison.
- Examples: full Hono checkout/portal/webhook integration, and the
  recommended lazy-expiry "effective plan" pattern for recurring access.
- Reference docs: condensed API reference, webhook detail, account-gating +
  currency-limitation notes (Subscriptions are Limited Access; recurring
  billing is USD-only today), and a subscriptions implementation guide
  (DB schema, cancel-at-period-end UX, plan changes/proration).
- `INSTALL.md` covering global skill install, project-scoped install, and
  using the client code standalone without the skill wrapper.
