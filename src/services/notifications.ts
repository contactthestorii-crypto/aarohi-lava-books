import "server-only";
import { siteUrl } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { renderOrderEmail, type OrderEmailKind } from "@/lib/email/templates";
import { emailConfig } from "@/lib/env";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";
import { formatPaise } from "@/lib/utils/money";
import { getOrderById, type OrderDetailView } from "./order-queries";
import { getFreshSettings } from "./settings";

export function orderLinkFor(order: Pick<OrderDetailView, "orderNumber" | "accessToken">): string {
  return `${siteUrl}/order-success?order=${encodeURIComponent(order.orderNumber)}&token=${order.accessToken}`;
}

/** Emails the customer about an order event. Never throws. */
export async function notifyCustomer(orderId: string, kind: OrderEmailKind, extra: { refundPaise?: number } = {}): Promise<void> {
  try {
    const [order, settings] = await Promise.all([getOrderById(getAdminSupabase(), orderId), getFreshSettings()]);
    if (!order) return;
    const shipment = order.shipments.find((s) => s.isActive);
    const email = renderOrderEmail(kind, {
      storeName: settings.store.name,
      supportEmail: settings.store.support_email,
      orderNumber: order.orderNumber,
      customerName: order.customerName.split(" ")[0] || order.customerName,
      totalPaise: order.totalPaise,
      paymentMethod: order.paymentMethod,
      items: order.items.map((i) => ({ title: i.title, quantity: i.quantity, lineTotalPaise: i.lineTotalPaise })),
      orderUrl: orderLinkFor(order),
      trackUrl: `${siteUrl}/track-order`,
      courierName: shipment?.courierName,
      awb: shipment?.awb,
      trackingUrl: shipment?.trackingUrl,
      cancelReason: order.cancelReason,
      refundPaise: extra.refundPaise ?? null,
    });
    await sendEmail({ to: order.customerEmail, ...email, replyTo: settings.store.support_email || undefined });
  } catch (error) {
    log.error("notify.customer", error, { orderId, kind });
  }
}

/** Tells the store team about a new confirmed order. Never throws. */
export async function notifyAdminNewOrder(orderId: string): Promise<void> {
  const { adminEmail } = emailConfig();
  if (!adminEmail) return;
  try {
    const order = await getOrderById(getAdminSupabase(), orderId);
    if (!order) return;
    const lines = order.items.map((i) => `${i.title} x ${i.quantity}`).join("\n");
    await sendEmail({
      to: adminEmail,
      subject: `New order ${order.orderNumber} (${order.paymentMethod === "cod" ? "COD" : "paid"}) ${formatPaise(order.totalPaise)}`,
      text: `${order.customerName}, ${order.customerPhone}\n${order.shippingAddress.city}, ${order.shippingAddress.pincode}\n\n${lines}\n\n${siteUrl}/admin/orders/${order.id}`,
      html: `<p><b>${order.orderNumber}</b> from ${order.customerName} (${order.customerPhone})</p><pre>${lines.replace(/</g, "&lt;")}</pre><p><a href="${siteUrl}/admin/orders/${order.id}">Open in admin</a></p>`,
    });
  } catch (error) {
    log.error("notify.admin", error, { orderId });
  }
}
