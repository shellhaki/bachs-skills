import { BachsHttp, type BachsClientOptions } from "./client";
import { ProductsResource } from "./products";
import { CustomersResource } from "./customers";
import { CheckoutSessionsResource } from "./checkout-sessions";
import { SubscriptionsResource } from "./subscriptions";
import { WebhookEndpointsResource } from "./webhooks";

export * from "./types";
export { constructWebhookEvent } from "./webhooks";

/**
 * Minimal Bachs API client.
 *
 * ```ts
 * import { Bachs } from "./src";
 *
 * const bachs = new Bachs({ apiKey: process.env.BACHS_SECRET_KEY! });
 *
 * const session = await bachs.checkoutSessions.create({
 *   customer: { email: "jane@example.com" },
 *   product_cart: [{ product_id: "prod_abc123" }],
 *   success_url: "https://app.example.com/billing/success",
 * });
 * // redirect user to session.checkout_url
 * ```
 */
export class Bachs {
  readonly products: ProductsResource;
  readonly customers: CustomersResource;
  readonly checkoutSessions: CheckoutSessionsResource;
  readonly subscriptions: SubscriptionsResource;
  readonly webhookEndpoints: WebhookEndpointsResource;

  constructor(options: BachsClientOptions) {
    const http = new BachsHttp(options);
    this.products = new ProductsResource(http);
    this.customers = new CustomersResource(http);
    this.checkoutSessions = new CheckoutSessionsResource(http);
    this.subscriptions = new SubscriptionsResource(http);
    this.webhookEndpoints = new WebhookEndpointsResource(http);
  }
}
