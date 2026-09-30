import { createHmac, timingSafeEqual } from "node:crypto";

// Pure signature helpers (unit-tested in tests/unit/payments.test.ts).

export function hmacSha256Hex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

/** Constant-time comparison of two hex/text signatures. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Razorpay Checkout callback: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyRazorpayPaymentSignature(params: {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
  keySecret: string;
}): boolean {
  if (!params.keySecret || !params.signature) return false;
  const expected = hmacSha256Hex(params.keySecret, `${params.providerOrderId}|${params.providerPaymentId}`);
  return safeEqual(expected, params.signature);
}

/** Razorpay webhook: HMAC_SHA256(raw request body, webhook secret) in X-Razorpay-Signature. */
export function verifyRazorpayWebhookSignature(rawBody: string, signature: string | null, webhookSecret: string): boolean {
  if (!webhookSecret || !signature) return false;
  return safeEqual(hmacSha256Hex(webhookSecret, rawBody), signature);
}
