import { createHmac, timingSafeEqual } from "node:crypto";
import type { BachsHttp } from "./client";
import type {
  BachsWebhookEvent,
  CreateWebhookEndpointInput,
  WebhookEndpoint,
  WebhookEndpointWithSecret,
} from "./types";

const DEFAULT_TOLERANCE_SECONDS = 300; // 5 minutes, matches Bachs' own example

/**
 * Verify a Bachs webhook delivery and parse it.
 *
 * MUST be called with the raw, unparsed request body (a string or Buffer) —
 * verifying after JSON.parse/re-stringify will not match the signature,
 * because whitespace/key-order changes the bytes that were signed.
 *
 * Headers Bachs sends on every delivery:
 *   X-Bachs-Timestamp  — unix seconds when the event was sent
 *   X-Bachs-Signature  — hex HMAC-SHA256 of `${timestamp}.${rawBody}`, keyed
 *                        with the endpoint's signing secret (`whsec_...`)
 *
 * Throws on a bad/stale/missing signature — never trust an unverified body.
 */
export function constructWebhookEvent(
  rawBody: string | Buffer,
  headers: { timestamp: string | null | undefined; signature: string | null | undefined },
  signingSecret: string,
  toleranceSeconds: number = DEFAULT_TOLERANCE_SECONDS,
): BachsWebhookEvent {
  const { timestamp: timestampHeader, signature: signatureHeader } = headers;

  if (!timestampHeader || !signatureHeader) {
    throw new Error("Missing X-Bachs-Timestamp or X-Bachs-Signature header");
  }

  const timestamp = parseInt(timestampHeader, 10);
  if (!Number.isFinite(timestamp)) {
    throw new Error("Invalid X-Bachs-Timestamp header");
  }

  // Reject stale/replayed deliveries.
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) {
    throw new Error("Webhook timestamp outside tolerance window (possible replay)");
  }

  const bodyString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const message = `${timestamp}.${bodyString}`;
  const expected = createHmac("sha256", signingSecret).update(message, "utf8").digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signatureHeader, "utf8");

  const signatureValid =
    expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf);

  if (!signatureValid) {
    throw new Error("Webhook signature verification failed");
  }

  return JSON.parse(bodyString) as BachsWebhookEvent;
}

export class WebhookEndpointsResource {
  constructor(private readonly http: BachsHttp) {}

  /**
   * The signing secret is returned ONLY on this call — store it immediately
   * (env var / secrets manager). It cannot be re-fetched in full afterward;
   * if lost, rotate it instead (`rotateSecret`).
   */
  create(input: CreateWebhookEndpointInput): Promise<WebhookEndpointWithSecret> {
    return this.http.post<WebhookEndpointWithSecret>("/v1/webhooks/endpoints", input);
  }

  list(): Promise<{ data: WebhookEndpoint[] }> {
    return this.http.get<{ data: WebhookEndpoint[] }>("/v1/webhooks/endpoints");
  }

  get(endpointId: string): Promise<WebhookEndpoint> {
    return this.http.get<WebhookEndpoint>(`/v1/webhooks/endpoints/${encodeURIComponent(endpointId)}`);
  }

  delete(endpointId: string): Promise<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(
      `/v1/webhooks/endpoints/${encodeURIComponent(endpointId)}`,
    );
  }

  /** Old secret stops working immediately — update your verification code first if you can't tolerate a gap. */
  rotateSecret(endpointId: string): Promise<WebhookEndpointWithSecret> {
    return this.http.post<WebhookEndpointWithSecret>(
      `/v1/webhooks/endpoints/${encodeURIComponent(endpointId)}/rotate-secret`,
    );
  }
}
