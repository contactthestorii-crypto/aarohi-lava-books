import "server-only";
import { revalidateTag } from "next/cache";
import { getPaymentProviderByName } from "@/lib/payments";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { CATALOG_TAG } from "@/lib/supabase/public";
import { log } from "@/lib/utils/log";
import type { OrderStatus } from "@/types";
import { notifyAdminNewOrder, notifyCustomer } from "./notifications";
import { getOrderById } from "./order-queries";
import { getFreshSettings } from "./settings";
import { createShipmentForOrder } from "./shipping";

// Order state changes. Every transition goes through the Postgres functions so it is
// atomic and idempotent (docs/ARCHITECTURE.md).

export class OrderError extends Error {
  constructor(message: string, readonly userMessage: string) {
    super(message);
  }
}

/** Stock levels changed: refresh cached catalog pages in the background. */
function refreshCatalog() {
  try {
    revalidateTag(CATALOG_TAG, "max");
  } catch {
    // Outside a request scope (e.g. tests): nothing to revalidate.
  }
}

/** Runs after an order becomes paid (online) or is placed (COD). Safe to call once per order. */
export async function afterOrderConfirmed(orderId: string, kind: "payment_successful" | "order_placed") {
  refreshCatalog();
  await Promise.all([notifyCustomer(orderId, kind), notifyAdminNewOrder(orderId)]);
  const settings = await getFreshSettings().catch(() => null);
  if (settings?.orders.auto_create_shipment) {
    await createShipmentForOrder(orderId).catch((error) => log.error("orders.autoShipment", error, { orderId }));
  }
}

export interface FinalizeInput {
  orderId: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId: string;
  amountPaise: number;
  raw?: Record<string, unknown>;
}

/** Marks an online order paid. Idempotent: browser callback and webhook may both call it. */
export async function finalizeOnlinePayment(input: FinalizeInput): Promise<{ finalized: boolean }> {
  const { data, error } = await getAdminSupabase().rpc("finalize_paid_order", {
    p_order_id: input.orderId,
    p_provider: input.provider,
    p_provider_order_id: input.providerOrderId,
    p_provider_payment_id: input.providerPaymentId,
    p_amount_paise: input.amountPaise,
    p_raw: input.raw ?? null,
  });
  if (error) throw error;
  const result = data as { finalized: boolean; reason?: string; needs_attention?: boolean };
  if (result.reason === "amount_mismatch") log.warn("orders.finalize", "Captured amount below order total", { orderId: input.orderId });
  if (result.finalized) await afterOrderConfirmed(input.orderId, "payment_successful");
  return { finalized: result.finalized };
}

export async function recordFailedPayment(provider: string, providerOrderId: string, providerPaymentId: string, code: string, description: string) {
  const { data: orderId, error } = await getAdminSupabase().rpc("mark_payment_failed", {
    p_provider: provider,
    p_provider_order_id: providerOrderId,
    p_provider_payment_id: providerPaymentId,
    p_error_code: code,
    p_error_description: description,
  });
  if (error) throw error;
  return orderId as string | null;
}

export async function findOrderIdByProviderOrder(provider: string, providerOrderId: string): Promise<string | null> {
  const { data } = await getAdminSupabase()
    .from("payments")
    .select("order_id")
    .eq("provider", provider)
    .eq("provider_order_id", providerOrderId)
    .maybeSingle();
  return (data?.order_id as string | undefined) ?? null;
}

export async function recordRefund(orderId: string, refundedTotalPaise: number, note: string) {
  const { data, error } = await getAdminSupabase().rpc("record_refund", {
    p_order_id: orderId,
    p_refunded_total_paise: refundedTotalPaise,
    p_note: note,
  });
  if (error) throw error;
  await notifyCustomer(orderId, "refund_processed", { refundPaise: refundedTotalPaise });
  return data as { full: boolean };
}

/** Admin refund through the gateway, then recorded locally. */
export async function refundOrder(orderId: string, amountPaise: number, reason: string) {
  const order = await getOrderById(getAdminSupabase(), orderId);
  if (!order) throw new OrderError("Order not found", "Order not found.");
  const payment = order.payments.find((p) => p.method === "online" && (p.status === "captured" || p.status === "partially_refunded"));
  if (!payment?.providerPaymentId) throw new OrderError("No captured payment", "This order has no captured online payment to refund.");
  const remaining = payment.amountPaise - payment.refundedPaise;
  if (amountPaise <= 0 || amountPaise > remaining) {
    throw new OrderError("Invalid refund amount", `Refund must be between ₹0.01 and ${remaining / 100}.`);
  }
  const provider = getPaymentProviderByName(payment.provider);
  if (!provider) throw new OrderError("Unknown provider", "This payment's gateway is not available.");
  await provider.refund(payment.providerPaymentId, amountPaise, reason);
  return recordRefund(orderId, payment.refundedPaise + amountPaise, `Refund: ${reason}`);
}

export async function cancelOrder(orderId: string, reason: string, actor: "admin" | "system" | "customer", restock = true) {
  const { error } = await getAdminSupabase().rpc("cancel_order", {
    p_order_id: orderId,
    p_reason: reason,
    p_actor: actor,
    p_restock: restock,
  });
  if (error) {
    if (error.message.includes("INVALID_TRANSITION")) {
      throw new OrderError(error.message, "This order can no longer be cancelled here (already shipped, delivered or closed).");
    }
    throw error;
  }
  refreshCatalog();
  await notifyCustomer(orderId, "order_cancelled");
}

/** Allowed manual transitions in the admin. Payment and cancellation have their own flows. */
export const MANUAL_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAID: ["PROCESSING", "PACKED", "SHIPPED"],
  PROCESSING: ["PACKED", "SHIPPED"],
  PACKED: ["PROCESSING", "SHIPPED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED", "RETURN_REQUESTED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "RETURN_REQUESTED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED", "DELIVERED"],
};

const STATUS_EMAIL: Partial<Record<OrderStatus, "order_processing" | "order_shipped" | "order_delivered">> = {
  PROCESSING: "order_processing",
  SHIPPED: "order_shipped",
  DELIVERED: "order_delivered",
};

export async function setOrderStatus(orderId: string, status: OrderStatus, message: string | null, actor: "admin" | "shipping") {
  const supabase = getAdminSupabase();
  const { data: current } = await supabase.from("orders").select("status, payment_method, payment_status").eq("id", orderId).maybeSingle();
  if (!current) throw new OrderError("Order not found", "Order not found.");
  if (actor === "admin" && !(MANUAL_TRANSITIONS[current.status as OrderStatus] ?? []).includes(status)) {
    throw new OrderError("Invalid transition", `An order that is ${String(current.status).toLowerCase().replace(/_/g, " ")} cannot move to ${status.toLowerCase().replace(/_/g, " ")}.`);
  }
  const { error } = await supabase.rpc("set_order_status", { p_order_id: orderId, p_status: status, p_message: message, p_actor: actor });
  if (error) throw error;

  // Cash collected on delivery.
  if (status === "DELIVERED" && current.payment_method === "cod" && current.payment_status === "cod_pending") {
    await supabase.from("orders").update({ payment_status: "cod_collected" }).eq("id", orderId);
    await supabase.from("payments").update({ status: "cod_collected" }).eq("order_id", orderId).eq("method", "cod");
  }
  const emailKind = STATUS_EMAIL[status];
  if (emailKind) await notifyCustomer(orderId, emailKind);
}

export async function expirePendingOrders(): Promise<number> {
  const { data, error } = await getAdminSupabase().rpc("expire_pending_orders");
  if (error) throw error;
  const count = Number(data) || 0;
  if (count > 0) refreshCatalog();
  return count;
}
