// Bachs API types — hand-written from the real OpenAPI spec at
// https://docs.bachs.io/docs/openapi/openapi.json (fetched 2026-08-05).
// Only the fields actually used by this skill's client are typed; anything
// else on a Bachs response just flows through untyped.

export type BillingInterval = "day" | "week" | "month" | "year";

export interface BillingCycle {
  interval: BillingInterval;
  frequency: number; // e.g. { interval: "month", frequency: 1 } = monthly
}

export interface TrialPeriod {
  interval: BillingInterval;
  frequency: number;
}

export interface PriceInput {
  currency: string; // ISO 4217, e.g. "USD"
  amount: string; // decimal string, e.g. "29.00"
  currency_options?: Array<{ currency: string; amount: string }>;
}

// ---------- Products ----------

export interface CreateProductInput {
  name: string;
  description?: string | null;
  price: PriceInput;
  metadata?: Record<string, unknown> | null;
  /** Omit for a one-time product. Set to make the product recurring. */
  billing_cycle?: BillingCycle | null;
  /** Beta. Only valid on a recurring product. */
  trial_period?: TrialPeriod | null;
}

export interface BachsProduct {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  price: {
    currency: string;
    price_type: string;
    amount: string;
    currency_options: Array<{ currency: string; amount: string }>;
  };
  billing_cycle: BillingCycle | null;
  trial_period: TrialPeriod | null;
  status: "active" | "archived" | string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

// ---------- Customers ----------

export interface CustomerBillingAddress {
  line1: string;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  /** ISO-3166-1 alpha-2 */
  country: string;
}

export interface CreateCustomerInput {
  email: string;
  name?: string | null;
  /** E.164, e.g. "+2348012345678" */
  phone_number?: string | null;
  metadata?: Record<string, unknown> | null;
  billing_address?: CustomerBillingAddress | null;
}

export interface BachsCustomer {
  id: string;
  email: string;
  name: string | null;
  phone_number: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PortalSession {
  id: string;
  url: string;
}

// ---------- Checkout sessions ----------

export type PaymentMethodType = "card" | "crypto" | "bank_transfer" | "mobile_money";

export interface ProductCartItem {
  product_id: string;
  quantity?: number;
}

export interface CheckoutCustomerNew {
  email: string;
  name?: string;
  phone_number?: string;
}

export interface CheckoutCustomerExisting {
  customer_id: string;
}

export interface CreateCheckoutSessionInput {
  /** New customer (email required) or an existing customer_id. */
  customer: CheckoutCustomerNew | CheckoutCustomerExisting;
  /** Products to charge. Mutually exclusive with `pricing`. Required for a subscription checkout. */
  product_cart?: ProductCartItem[];
  /** Raw amount/currency for a product-less checkout. Mutually exclusive with `product_cart`. */
  pricing?: { currency: string; amount: string };
  success_url?: string;
  cancel_url?: string;
  billing_currency?: string;
  allowed_payment_method_types?: PaymentMethodType[];
  /** Unique per organization. Auto-generated if omitted — pass your own internal order/user id to correlate webhooks. */
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface CheckoutSession {
  checkout_id: string;
  checkout_url: string;
  status: "open" | "completed" | "expired" | string;
  expires_at: string;
  created_at: string;
  reference: string | null;
}

// ---------- Subscriptions ----------

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "trialing"
  | string;

export interface BachsSubscription {
  id: string;
  payment_method_id: string | null;
  status: SubscriptionStatus;
  collection_method: "charge_automatically" | string;
  currency: string;
  amount: string;
  billing_cycle: BillingCycle;
  quantity: number;
  current_period_start: string;
  current_period_end: string;
  previously_billed_at: string | null;
  next_billed_at: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  product: {
    id: string;
    name: string;
    description?: string | null;
    status: string;
    billing_cycle: BillingCycle;
    trial_period: TrialPeriod | null;
    created_at: string;
    updated_at: string;
  };
  items: Array<Record<string, unknown>>;
  customer_id?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSubscriptionInput {
  /** Change plan. Cannot combine with trial_end/payment_method_id/metadata in one call. */
  product_id?: string;
  /** Future = add/extend trial. Past-or-now = end trial and bill now. */
  trial_end?: string;
  payment_method_id?: string;
  metadata?: Record<string, string> | "";
  /** How a plan change is settled. Defaults to invoice_now. */
  proration_behavior?: "invoice_now" | "next_cycle" | "none";
}

export interface CancelSubscriptionInput {
  /** true = keep access until current_period_end, then cancel. false = cancel now. Default false. */
  cancel_at_period_end?: boolean;
  reason?: string;
}

// ---------- Webhooks ----------

export type BachsWebhookEventType =
  | "collection.succeeded"
  | "collection.failed"
  | "collection.underpaid"
  | "checkout.completed"
  | "checkout.expired"
  | "payout.created"
  | "payout.paid"
  | "payout.failed"
  | "refund.created"
  | "refund.paid"
  | "refund.failed"
  | "conversion.completed"
  | "conversion.failed"
  | "customer.created"
  | "customer.updated"
  | "dispute.created"
  | "dispute.updated"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.created"
  | "invoice.paid"
  | "invoice.payment_failed";

export interface BachsWebhookEvent<T = unknown> {
  event_id: string;
  event_type: BachsWebhookEventType | string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  /** For subscription/invoice events this is the Subscription/Invoice object. */
  data: T;
}

export interface CreateWebhookEndpointInput {
  name: string;
  url: string;
  event_types: BachsWebhookEventType[];
}

export interface WebhookEndpoint {
  endpoint_id: string;
  name: string;
  url: string;
  enabled: boolean;
  event_types: BachsWebhookEventType[];
  created_at: string;
  updated_at: string;
}

/** Returned only once, on create/rotate. Store it (e.g. env var) — it can't be re-fetched in full afterward. */
export interface WebhookEndpointWithSecret extends WebhookEndpoint {
  signing_secret: string;
}

// ---------- Errors ----------

/**
 * Error codes Bachs returns for account-gating on Subscriptions specifically.
 * See references/webhooks.md and references/subscriptions-guide.md — subscriptions
 * are "Limited Access": contact support@bachs.xyz to enable them before any of
 * this code will work end-to-end.
 */
export type BachsGatingErrorCode =
  | "SUBSCRIPTIONS_NOT_ENABLED"
  | "NGN_SUBSCRIPTIONS_NOT_ENABLED"
  | "TRIALS_NOT_ENABLED";

export class BachsApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    const code = (body as any)?.error?.code ?? (body as any)?.code;
    const message =
      (body as any)?.error?.message ?? (body as any)?.message ?? `Bachs API error (HTTP ${status})`;
    super(message);
    this.name = "BachsApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}
