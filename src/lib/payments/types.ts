// Provider-neutral payment contracts (docs/DECISIONS.md ADR-006). Adding another Indian
// gateway (Cashfree, PayU, PhonePe) means implementing PaymentProvider in a new module.

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amountPaise: number;
  customer: { name: string; email: string; phone: string };
}

/** What the browser needs to open the gateway's checkout. Never contains secrets. */
export type ClientCheckout =
  | {
      provider: "razorpay";
      keyId: string;
      providerOrderId: string;
      amountPaise: number;
      currency: "INR";
      name: string;
      description: string;
      prefill: { name: string; email: string; contact: string };
    }
  | { provider: "mock"; providerOrderId: string; amountPaise: number };

export interface CreatePaymentResult {
  providerOrderId: string;
  checkout: ClientCheckout;
}

export interface ClientPaymentResult {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface ConfirmedPayment {
  status: "captured" | "pending" | "failed";
  amountPaise: number;
  providerOrderId: string;
  providerPaymentId: string;
  raw: Record<string, unknown>;
}

export type WebhookEvent =
  | { id: string; type: "payment.captured"; providerOrderId: string; providerPaymentId: string; amountPaise: number; raw: Record<string, unknown> }
  | { id: string; type: "payment.failed"; providerOrderId: string; providerPaymentId: string; errorCode: string; errorDescription: string }
  | { id: string; type: "refund.processed"; providerOrderId: string; providerPaymentId: string; refundedTotalPaise: number }
  | { id: string; type: "ignored"; name: string };

export interface PaymentProvider {
  readonly name: "razorpay" | "mock";
  isConfigured(): boolean;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  /** Browser checkout details for an existing gateway order (used for payment retries). No API call. */
  checkoutFor(providerOrderId: string, input: CreatePaymentInput): ClientCheckout;
  /** Verifies the signature returned to the browser, then confirms (and captures if needed) with the gateway. */
  confirmClientPayment(result: ClientPaymentResult, expectedAmountPaise: number): Promise<ConfirmedPayment>;
  verifyWebhook(rawBody: string, headers: Headers): boolean;
  parseWebhook(rawBody: string, headers: Headers): WebhookEvent;
  refund(providerPaymentId: string, amountPaise: number, note: string): Promise<{ refundId: string }>;
}

export class PaymentError extends Error {
  constructor(
    message: string,
    readonly userMessage = "The payment service is unavailable right now. You have not been charged. Please try again.",
  ) {
    super(message);
    this.name = "PaymentError";
  }
}
