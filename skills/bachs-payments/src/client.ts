import { BachsApiError } from "./types";

export interface BachsClientOptions {
  /** `sk_sandbox_...` for testing, `sk_live_...` for production. */
  apiKey: string;
  /** Override for testing against a mock server. Defaults to the real API. */
  baseUrl?: string;
}

/**
 * Thin fetch-based HTTP client for the Bachs API. No dependencies beyond a
 * global `fetch` (available in Bun, Node 18+, Deno, Cloudflare Workers, browsers).
 *
 * Kept deliberately simple — one class, no retries/backoff, no codegen.
 * Add retry logic at the call site if you need it.
 */
export class BachsHttp {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: BachsClientOptions) {
    if (!options.apiKey) {
      throw new Error("Bachs API key is required (sk_sandbox_... or sk_live_...)");
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://api.bachs.io").replace(/\/+$/, "");
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    const parsed = text ? JSON.parse(text) : undefined;

    if (!res.ok) {
      throw new BachsApiError(res.status, parsed);
    }

    return parsed as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }
  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }
  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }
  delete<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("DELETE", path, body);
  }
}
