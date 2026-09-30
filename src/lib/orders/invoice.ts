import type { OrderStatus, PaymentStatus } from "@/types";

const INVOICEABLE: OrderStatus[] = ["PAID", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

/** Invoices exist for paid orders, and for COD orders once delivered (payment collected). */
export function canDownloadInvoice(order: { status: OrderStatus; paymentStatus: PaymentStatus }): boolean {
  if (!INVOICEABLE.includes(order.status)) return false;
  return order.paymentStatus === "captured" || order.paymentStatus === "cod_collected" || order.status === "DELIVERED";
}
