import "server-only";
import { razorpayConfig } from "@/lib/env";
import { log } from "@/lib/utils/log";
import { verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from "./signature";
import { PaymentError, type ConfirmedPayment, type PaymentProvider, type WebhookEvent } from "./types";

// Razorpay REST adapter (https://razorpay.com/docs/api). Orders are created server-side with
// the server-computed amount; the key secret never leaves the server.

const API = "https://api.razorpay.com/v1";

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { keyId, keySecret } = razorpayConfig();
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: { code?: string; description?: string } };
  if (!response.ok) {
    throw new PaymentError(`Razorpay ${path} failed: ${response.status} ${body.error?.code ?? ""} ${body.error?.description ?? ""}`);
  }
  return body;
}

interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method?: string;
  amount_refunded?: number;
  error_code?: string | null;
  error_description?: string | null;
}

function sanitisePayment(payment: RazorpayPayment): Record<string, unknown> {
  // Keep only non-sensitive fields for our records.
  return {
    id: payment.id,
    order_id: payment.order_id,
    amount: payment.amount,
    status: payment.status,
    method: payment.method,
    amount_refunded: payment.amount_refunded,
  };
}

export const razorpayProvider: PaymentProvider = {
  name: "razorpay",
  isConfigured: () => razorpayConfig().configured,

  async createPayment({ orderId, orderNumber, amountPaise, customer }) {
    const order = await api<{ id: string }>("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: orderNumber,
        notes: { order_id: orderId, order_number: orderNumber },
      }),
    });
    return { providerOrderId: order.id, checkout: razorpayProvider.checkoutFor(order.id, { orderId, orderNumber, amountPaise, customer }) };
  },

  checkoutFor(providerOrderId, { orderNumber, amountPaise, customer }) {
    return {
      provider: "razorpay",
      keyId: razorpayConfig().keyId,
      providerOrderId,
      amountPaise,
      currency: "INR",
      name: "Aarohi Lava Publications",
      description: `Order ${orderNumber}`,
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
    };
  },

  async confirmClientPayment(result, expectedAmountPaise): Promise<ConfirmedPayment> {
    const { keySecret } = razorpayConfig();
    const valid = verifyRazorpayPaymentSignature({ ...result, keySecret });
    if (!valid) throw new PaymentError("Invalid Razorpay payment signature", "We could not verify this payment. If money was debited, it will be refunded automatically by your bank or confirmed shortly.");

    let payment = await api<RazorpayPayment>(`/payments/${encodeURIComponent(result.providerPaymentId)}`);
    if (payment.order_id !== result.providerOrderId) throw new PaymentError("Payment does not belong to this order");
    if (payment.status === "authorized") {
      // Accounts without auto-capture: capture the exact order amount now.
      payment = await api<RazorpayPayment>(`/payments/${encodeURIComponent(payment.id)}/capture`, {
        method: "POST",
        body: JSON.stringify({ amount: expectedAmountPaise, currency: "INR" }),
      });
    }
    return {
      status: payment.status === "captured" ? "captured" : payment.status === "failed" ? "failed" : "pending",
      amountPaise: payment.amount,
      providerOrderId: payment.order_id,
      providerPaymentId: payment.id,
      raw: sanitisePayment(payment),
    };
  },

  verifyWebhook(rawBody, headers) {
    return verifyRazorpayWebhookSignature(rawBody, headers.get("x-razorpay-signature"), razorpayConfig().webhookSecret);
  },

  parseWebhook(rawBody, headers): WebhookEvent {
    const body = JSON.parse(rawBody) as {
      event: string;
      created_at?: number;
      payload?: {
        payment?: { entity: RazorpayPayment };
        refund?: { entity: { id: string; payment_id: string; amount: number } };
      };
    };
    const payment = body.payload?.payment?.entity;
    const id = headers.get("x-razorpay-event-id") ?? `${body.event}:${payment?.id ?? body.payload?.refund?.entity.id}:${body.created_at ?? ""}`;
    switch (body.event) {
      case "payment.captured":
      case "order.paid":
        if (!payment) break;
        return { id, type: "payment.captured", providerOrderId: payment.order_id, providerPaymentId: payment.id, amountPaise: payment.amount, raw: sanitisePayment(payment) };
      case "payment.failed":
        if (!payment) break;
        return {
          id,
          type: "payment.failed",
          providerOrderId: payment.order_id,
          providerPaymentId: payment.id,
          errorCode: payment.error_code ?? "PAYMENT_FAILED",
          errorDescription: payment.error_description ?? "Payment failed",
        };
      case "refund.processed":
        if (!payment) break;
        return {
          id,
          type: "refund.processed",
          providerOrderId: payment.order_id,
          providerPaymentId: payment.id,
          refundedTotalPaise: payment.amount_refunded ?? body.payload?.refund?.entity.amount ?? 0,
        };
    }
    return { id, type: "ignored", name: body.event };
  },

  async refund(providerPaymentId, amountPaise, note) {
    try {
      const refund = await api<{ id: string }>(`/payments/${encodeURIComponent(providerPaymentId)}/refund`, {
        method: "POST",
        body: JSON.stringify({ amount: amountPaise, notes: { reason: note.slice(0, 250) } }),
      });
      return { refundId: refund.id };
    } catch (error) {
      log.error("razorpay.refund", error, { providerPaymentId });
      throw new PaymentError(String(error), "Razorpay could not process the refund. Check the Razorpay dashboard.");
    }
  },
};
