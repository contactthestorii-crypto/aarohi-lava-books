import { formatPaise } from "@/lib/utils/money";

// Plain, table-free email templates (render well in Gmail and on phones). All dynamic
// values are escaped.

export type OrderEmailKind =
  | "order_placed"
  | "payment_successful"
  | "payment_failed"
  | "order_processing"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "refund_processed";

export interface OrderEmailData {
  storeName: string;
  supportEmail: string;
  orderNumber: string;
  customerName: string;
  totalPaise: number;
  paymentMethod: "online" | "cod";
  items: { title: string; quantity: number; lineTotalPaise: number }[];
  orderUrl: string;
  trackUrl: string;
  courierName?: string | null;
  awb?: string | null;
  trackingUrl?: string | null;
  cancelReason?: string | null;
  refundPaise?: number | null;
}

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const COPY: Record<OrderEmailKind, (d: OrderEmailData) => { subject: string; lead: string }> = {
  order_placed: (d) => ({
    subject: `Order ${d.orderNumber} received`,
    lead:
      d.paymentMethod === "cod"
        ? "Thank you for your order. We are preparing it now. Please keep the amount ready for cash on delivery."
        : "Thank you for your order. We have reserved your books and are waiting for your payment to complete.",
  }),
  payment_successful: (d) => ({
    subject: `Payment received for order ${d.orderNumber}`,
    lead: "Your payment was successful. We will pack and ship your books soon.",
  }),
  payment_failed: (d) => ({
    subject: `Payment not completed for order ${d.orderNumber}`,
    lead: "Your payment did not go through, so you have not been charged. You can try again from your order page before the payment window closes.",
  }),
  order_processing: (d) => ({ subject: `Order ${d.orderNumber} is being prepared`, lead: "We are preparing your order for dispatch." }),
  order_shipped: (d) => ({ subject: `Order ${d.orderNumber} has shipped`, lead: "Good news: your books are on the way." }),
  order_delivered: (d) => ({ subject: `Order ${d.orderNumber} delivered`, lead: "Your order has been delivered. We hope the books help you prepare. All the best for your exam." }),
  order_cancelled: (d) => ({
    subject: `Order ${d.orderNumber} cancelled`,
    lead: `Your order has been cancelled.${d.cancelReason ? ` Reason: ${d.cancelReason}.` : ""} If you paid online, any refund is processed to your original payment method.`,
  }),
  refund_processed: (d) => ({
    subject: `Refund processed for order ${d.orderNumber}`,
    lead: `We have processed a refund${d.refundPaise ? ` of ${formatPaise(d.refundPaise)}` : ""}. Banks usually take 5 to 7 working days to show it in your account.`,
  }),
};

export function renderOrderEmail(kind: OrderEmailKind, data: OrderEmailData) {
  const { subject, lead } = COPY[kind](data);
  const itemsText = data.items.map((i) => `- ${i.title} x ${i.quantity}: ${formatPaise(i.lineTotalPaise)}`).join("\n");
  const shipText =
    kind === "order_shipped" && data.awb
      ? `\nCourier: ${data.courierName ?? "Courier partner"}\nTracking number (AWB): ${data.awb}${data.trackingUrl ? `\nTrack: ${data.trackingUrl}` : ""}\n`
      : "";

  const text = `Hello ${data.customerName},

${lead}

Order: ${data.orderNumber}
${itemsText}
Total: ${formatPaise(data.totalPaise)}
${shipText}
View your order: ${data.orderUrl}
Track your order: ${data.trackUrl}

Questions? Reply to this email${data.supportEmail ? ` or write to ${data.supportEmail}` : ""}.
${data.storeName}`;

  const itemsHtml = data.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;color:#0b1733">${escape(i.title)} &times; ${i.quantity}</td><td style="padding:6px 0;text-align:right;color:#0b1733">${formatPaise(i.lineTotalPaise)}</td></tr>`,
    )
    .join("");
  const shipHtml =
    kind === "order_shipped" && data.awb
      ? `<p style="margin:16px 0;padding:12px;background:#f3f6fb;border-radius:8px">Courier: <b>${escape(data.courierName ?? "Courier partner")}</b><br>Tracking number (AWB): <b>${escape(data.awb)}</b>${data.trackingUrl ? `<br><a href="${escape(data.trackingUrl)}" style="color:#1f3b7a">Track on courier website</a>` : ""}</p>`
      : "";

  const html = `<!doctype html><html><body style="margin:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#10214d;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0;font-weight:bold;font-size:18px">${escape(data.storeName)}</div>
<div style="background:#fff;padding:20px;border-radius:0 0 12px 12px;color:#0b1733;font-size:15px;line-height:1.5">
<p>Hello ${escape(data.customerName)},</p>
<p>${escape(lead)}</p>
<p style="margin:16px 0 4px;font-weight:bold">Order ${escape(data.orderNumber)}</p>
<table style="width:100%;border-collapse:collapse;font-size:14px">${itemsHtml}
<tr><td style="padding-top:8px;border-top:1px solid #d8deea;font-weight:bold">Total</td><td style="padding-top:8px;border-top:1px solid #d8deea;text-align:right;font-weight:bold">${formatPaise(data.totalPaise)}</td></tr></table>
${shipHtml}
<p style="margin-top:20px"><a href="${escape(data.orderUrl)}" style="display:inline-block;background:#c8102e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">View your order</a></p>
<p style="font-size:13px;color:#4b5673">Track any time at <a href="${escape(data.trackUrl)}" style="color:#1f3b7a">${escape(data.trackUrl)}</a> with your order ID and phone number.</p>
</div></div></body></html>`;

  return { subject, text, html };
}
