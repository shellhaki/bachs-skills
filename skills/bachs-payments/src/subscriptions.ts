import type { BachsHttp } from "./client";
import type {
  BachsSubscription,
  CancelSubscriptionInput,
  UpdateSubscriptionInput,
} from "./types";

export class SubscriptionsResource {
  constructor(private readonly http: BachsHttp) {}

  get(subscriptionId: string): Promise<BachsSubscription> {
    return this.http.get<BachsSubscription>(
      `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
    );
  }

  list(): Promise<{ data: BachsSubscription[] }> {
    return this.http.get<{ data: BachsSubscription[] }>("/v1/subscriptions");
  }

  /**
   * Send exactly ONE intent per call: change plan (product_id), move a trial
   * (trial_end), change payment method (payment_method_id), or update
   * metadata. Combining more than one in a single call returns 400.
   */
  update(subscriptionId: string, input: UpdateSubscriptionInput): Promise<BachsSubscription> {
    return this.http.patch<BachsSubscription>(
      `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
      input,
    );
  }

  /**
   * Cancel a subscription. `cancel_at_period_end: true` (recommended default
   * for most SaaS UX) keeps the customer's access until current_period_end
   * and only flips status to "canceled" then; `false` cancels immediately.
   */
  cancel(subscriptionId: string, input: CancelSubscriptionInput = {}): Promise<BachsSubscription> {
    return this.http.delete<BachsSubscription>(
      `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
      input,
    );
  }
}
