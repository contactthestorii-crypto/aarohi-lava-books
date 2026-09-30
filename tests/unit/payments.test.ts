import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  hmacSha256Hex,
  safeEqual,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "@/lib/payments/signature";

const keySecret = "test_key_secret";

describe("verifyRazorpayPaymentSignature", () => {
  const providerOrderId = "order_Nx9";
  const providerPaymentId = "pay_Q12";
  const valid = createHmac("sha256", keySecret).update(`${providerOrderId}|${providerPaymentId}`).digest("hex");

  it("accepts a correct signature", () => {
    expect(verifyRazorpayPaymentSignature({ providerOrderId, providerPaymentId, signature: valid, keySecret })).toBe(true);
  });

  it("rejects tampered ids, signatures and wrong secrets", () => {
    expect(verifyRazorpayPaymentSignature({ providerOrderId: "order_other", providerPaymentId, signature: valid, keySecret })).toBe(false);
    expect(verifyRazorpayPaymentSignature({ providerOrderId, providerPaymentId, signature: valid.replace(/.$/, "0"), keySecret })).toBe(false);
    expect(verifyRazorpayPaymentSignature({ providerOrderId, providerPaymentId, signature: valid, keySecret: "wrong" })).toBe(false);
  });

  it("rejects when the secret or signature is missing", () => {
    expect(verifyRazorpayPaymentSignature({ providerOrderId, providerPaymentId, signature: valid, keySecret: "" })).toBe(false);
    expect(verifyRazorpayPaymentSignature({ providerOrderId, providerPaymentId, signature: "", keySecret })).toBe(false);
  });
});

describe("verifyRazorpayWebhookSignature", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1", amount: 45000 } } } });
  const signature = hmacSha256Hex(secret, body);

  it("accepts the signature of the exact raw body", () => {
    expect(verifyRazorpayWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("rejects a modified body", () => {
    expect(verifyRazorpayWebhookSignature(body.replace("45000", "1"), signature, secret)).toBe(false);
  });

  it("rejects missing header or secret", () => {
    expect(verifyRazorpayWebhookSignature(body, null, secret)).toBe(false);
    expect(verifyRazorpayWebhookSignature(body, signature, "")).toBe(false);
  });
});

describe("safeEqual", () => {
  it("compares strings of different lengths safely", () => {
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("abc", "abc")).toBe(true);
  });
});
