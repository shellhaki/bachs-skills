import type { BachsHttp } from "./client";
import type { BachsProduct, CreateProductInput } from "./types";

export class ProductsResource {
  constructor(private readonly http: BachsHttp) {}

  /**
   * Create a product. Omit `billing_cycle` for a one-time product; include it
   * (e.g. `{ interval: "month", frequency: 1 }`) to make it a recurring plan —
   * that's the only thing that distinguishes a subscription plan from a
   * one-time product on Bachs. There is no separate "create plan" endpoint.
   */
  create(input: CreateProductInput): Promise<BachsProduct> {
    return this.http.post<BachsProduct>("/v1/products", input);
  }

  get(productId: string): Promise<BachsProduct> {
    return this.http.get<BachsProduct>(`/v1/products/${encodeURIComponent(productId)}`);
  }

  list(): Promise<{ data: BachsProduct[] }> {
    return this.http.get<{ data: BachsProduct[] }>("/v1/products");
  }

  archive(productId: string): Promise<BachsProduct> {
    return this.http.delete<BachsProduct>(`/v1/products/${encodeURIComponent(productId)}`);
  }
}
