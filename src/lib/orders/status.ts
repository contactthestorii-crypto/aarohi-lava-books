import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Payment confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  RETURN_REQUESTED: "Return in progress",
  RETURNED: "Returned",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  created: "Not paid yet",
  captured: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
  partially_refunded: "Partly refunded",
  cod_pending: "Pay on delivery",
  cod_collected: "Paid on delivery",
};

export type Tone = "neutral" | "brand" | "highlight" | "success" | "warning" | "danger";

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  PENDING_PAYMENT: "warning",
  PAID: "brand",
  PROCESSING: "brand",
  PACKED: "brand",
  SHIPPED: "brand",
  OUT_FOR_DELIVERY: "brand",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "neutral",
  RETURN_REQUESTED: "warning",
  RETURNED: "neutral",
};

export type StepState = "done" | "current" | "upcoming";

export interface TimelineStep {
  key: string;
  label: string;
  state: StepState;
  at: string | null;
}

const FLOW: OrderStatus[] = ["PAID", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

/**
 * Customer-facing progress steps. Timestamps come from recorded order events only; a
 * step reached without an event (e.g. skipped) shows no time rather than a guessed one.
 */
export function buildTimeline(
  status: OrderStatus,
  paymentMethod: PaymentMethod,
  createdAt: string,
  events: { status: OrderStatus | null; createdAt: string }[],
): TimelineStep[] {
  const firstAt = (s: OrderStatus) => events.find((e) => e.status === s)?.createdAt ?? null;
  const reachedIndex = status === "PENDING_PAYMENT" ? -1 : FLOW.indexOf(status);

  const steps: TimelineStep[] = [{ key: "placed", label: "Order placed", state: "done", at: createdAt }];
  FLOW.forEach((s, index) => {
    if (paymentMethod === "cod" && s === "PAID") return;
    const label = s === "PAID" ? "Payment confirmed" : ORDER_STATUS_LABEL[s];
    let state: StepState = "upcoming";
    if (reachedIndex >= 0 && index < reachedIndex) state = "done";
    if (index === reachedIndex) state = s === "DELIVERED" ? "done" : "current";
    steps.push({ key: s, label, state, at: state === "upcoming" ? null : firstAt(s) });
  });
  if (status === "PENDING_PAYMENT") {
    const payment = steps.find((step) => step.key === "PAID");
    if (payment) payment.state = "current";
  }
  return steps;
}

export function isTerminalProblem(status: OrderStatus): boolean {
  return status === "CANCELLED" || status === "REFUNDED" || status === "RETURN_REQUESTED" || status === "RETURNED";
}
