import type { BachsHttp } from "./client";
import type { BachsCustomer, CreateCustomerInput, PortalSession } from "./types";

export class CustomersResource {
  constructor(private readonly http: BachsHttp) {}

  create(input: CreateCustomerInput): Promise<BachsCustomer> {
    return this.http.post<BachsCustomer>("/v1/customers", input);
  }

  get(customerId: string): Promise<BachsCustomer> {
    return this.http.get<BachsCustomer>(`/v1/customers/${encodeURIComponent(customerId)}`);
  }

  list(): Promise<{ data: BachsCustomer[] }> {
    return this.http.get<{ data: BachsCustomer[] }>("/v1/customers");
  }

  /**
   * Create a hosted, self-service Customer Portal session. Send the customer
   * to `url` and they can cancel, update their card, or view invoices without
   * you having to build any of that UI yourself.
   */
  createPortalSession(customerId: string): Promise<PortalSession> {
    return this.http.post<PortalSession>(
      `/v1/customers/${encodeURIComponent(customerId)}/portal-sessions`,
    );
  }
}
