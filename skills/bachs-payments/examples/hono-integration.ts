// Example: wiring the Bachs skill into a Hono app (matches SparkDB's stack —
// Bun + Hono backend). Adjust import paths/DB calls for your own app.
//
// Env vars expected:
//   BACHS_SECRET_KEY      sk_sandbox_... or sk_live_...
//   BACHS_WEBHOOK_SECRET  whsec_... (from webhookEndpoints.create(), stored once)

import { Hono } from "hono";
import { Bachs, constructWebhookEvent, type BachsSubscription } from "../src";

const bachs = new Bachs({ apiKey: process.env.BACHS_SECRET_KEY! });
const WEBHOOK_SECRET = process.env.BACHS_WEBHOOK_SECRET!;

const app = new Hono();

// --- 1. Start a subscription checkout ---------------------------------
app.post("/billing/checkout", async (c) => {
  const user = c.get("user"); // however your auth middleware exposes the caller
  const { productId } = await c.req.json<{ productId: string }>();

  const session = await bachs.checkoutSessions.create({
    customer: { email: user.email },
    product_cart: [{ product_id: productId }],
    success_url: "https://app.example.com/dashboard/billing?upgraded=1",
    cancel_url: "https://app.example.com/dashboard/billing",
    // Correlate the webhook back to this user without a DB lookup by email.
    reference: `user_${user.id}`,
    metadata: { user_id: String(user.id) },
  });

  return c.json({ checkout_url: session.checkout_url });
});

// --- 2. Hand the customer a self-service portal (cancel / update card) --
app.post("/billing/portal", async (c) => {
  const user = c.get("user");
  // bachsCustomerId should already be stored on your user row from the
  // checkout.completed / customer.subscription.created webhook below.
  const portal = await bachs.customers.createPortalSession(user.bachsCustomerId);
  return c.json({ url: portal.url });
});

// --- 3. Webhook receiver -------------------------------------------------
// IMPORTANT: read the RAW body before any JSON-parsing middleware touches
// it — Hono's c.req.text() gives you the raw bytes, which is what you need.
app.post("/billing/webhook", async (c) => {
  const rawBody = await c.req.text();

  let event;
  try {
    event = constructWebhookEvent(
      rawBody,
      {
        timestamp: c.req.header("X-Bachs-Timestamp"),
        signature: c.req.header("X-Bachs-Signature"),
      },
      WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Bachs webhook signature check failed:", err);
    return c.text("Invalid signature", 400);
  }

  switch (event.event_type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data as BachsSubscription;
      // Persist sub.id, sub.status, sub.current_period_end, sub.cancel_at_period_end
      // against the user identified by event metadata / customer id.
      // See ../references/subscriptions-guide.md for the recommended schema
      // and the lazy-expiry "effective plan" read pattern.
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data as BachsSubscription;
      // Subscription reached its terminal cancellation. If you used
      // cancel_at_period_end, this fires once the period actually ends.
      break;
    }
    case "invoice.payment_failed": {
      // Bachs is auto-retrying (dunning) on its own schedule. No action
      // required unless you want to show a "past due" banner — the
      // subscription's own `status` will reflect this on the next
      // customer.subscription.updated event.
      break;
    }
    default:
      break; // ignore event types this endpoint isn't subscribed to
  }

  return c.text("ok", 200);
});

export default app;
