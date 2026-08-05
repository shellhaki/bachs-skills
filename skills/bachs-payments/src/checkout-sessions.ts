import type { BachsHttp } from "./client";
import type { CheckoutSession, CreateCheckoutSessionInput } from "./types";

export class CheckoutSessionsResource {
  constructor(private readonly http: BachsHttp) {}

  /**
   * Create a checkout session. There is no separate "create subscription"
   * call on Bachs — put a recurring product in `product_cart` and completing
   * this checkout auto-creates the Subscription. Redirect the customer to
   * the returned `checkout_url`.
   */
  create(input: CreateCheckoutSessionInput): Promise<CheckoutSession> {
    return this.http.post<CheckoutSession>("/v1/checkout-sessions", input);
  }

  get(checkoutId: string): Promise<CheckoutSession> {
    return this.http.get<CheckoutSession>(`/v1/checkout-sessions/${encodeURIComponent(checkoutId)}`);
  }
}
