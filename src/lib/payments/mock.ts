import "server-only";
import { randomUUID } from "node:crypto";
import { PaymentError, type PaymentProvider } from "./types";

/**
 * DEVELOPMENT-ONLY simulated gateway (docs/DECISIONS.md ADR-010). Selected with
 * PAYMENT_PROVIDER=mock, shown with a "Test mode" banner, and refused on production
 * deployments by getPaymentProvider(). No money moves.
 */
export const MOCK_SUCCESS_SIGNATURE = "mock-success";

export const mockProvider: PaymentProvider = {
  name: "mock",
  isConfigured: () => true,

  async createPayment({ amountPaise }) {
    const providerOrderId = `mock_order_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
    return { providerOrderId, checkout: { provider: "mock", providerOrderId, amountPaise } };
  },

  checkoutFor(providerOrderId, { amountPaise }) {
    return { provider: "mock", providerOrderId, amountPaise };
  },

  async confirmClientPayment(result, expectedAmountPaise) {
    if (result.signature !== MOCK_SUCCESS_SIGNATURE) throw new PaymentError("Mock payment declined", "The simulated payment was declined.");
    return {
      status: "captured",
      amountPaise: expectedAmountPaise,
      providerOrderId: result.providerOrderId,
      providerPaymentId: result.providerPaymentId,
      raw: { mock: true },
    };
  },

  verifyWebhook: () => false,
  parseWebhook: () => ({ id: "mock", type: "ignored", name: "mock" }),

  async refund() {
    return { refundId: `mock_refund_${randomUUID().slice(0, 8)}` };
  },
};
