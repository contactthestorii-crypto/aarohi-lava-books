import { ArrowSquareOut, Check, Info, MapPin, Truck } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import { formatPaise } from "@/lib/utils/money";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  PAYMENT_STATUS_LABEL,
  buildTimeline,
  isTerminalProblem,
} from "@/lib/orders/status";
import type { OrderDetailView, ShipmentView } from "@/services/order-queries";
import type { OrderStatus, PaymentStatus, ShippingAddress } from "@/types";

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone = status === "captured" || status === "cod_collected" ? "success" : status === "failed" ? "danger" : status === "created" ? "warning" : "neutral";
  return <Badge tone={tone}>{PAYMENT_STATUS_LABEL[status]}</Badge>;
}

export function OrderTimeline({ order }: { order: OrderDetailView }) {
  if (isTerminalProblem(order.status)) {
    const last = [...order.events].reverse().find((e) => e.status === order.status);
    return (
      <div className="flex gap-3 rounded-[var(--radius-card)] border border-line bg-navy-50 p-4">
        <Info size={22} className="shrink-0 text-navy-700" />
        <div>
          <p className="font-semibold">{ORDER_STATUS_LABEL[order.status]}</p>
          {last?.message || order.cancelReason ? <p className="mt-0.5 text-sm text-muted">{last?.message ?? order.cancelReason}</p> : null}
          {last ? <p className="mt-0.5 text-xs text-muted">{formatDateTime(last.createdAt)}</p> : null}
        </div>
      </div>
    );
  }
  const steps = buildTimeline(order.status, order.paymentMethod, order.createdAt, order.events);
  return (
    <ol className="relative">
      {steps.map((step, index) => (
        <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
          {index < steps.length - 1 ? (
            <span aria-hidden="true" className={cn("absolute left-[11px] top-6 h-[calc(100%-1rem)] w-0.5", step.state === "done" ? "bg-navy-900" : "bg-line")} />
          ) : null}
          <span
            className={cn(
              "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full",
              step.state === "done" && "bg-navy-900 text-white",
              step.state === "current" && "bg-white ring-4 ring-red-600/25 [&>span]:bg-red-600",
              step.state === "upcoming" && "bg-white ring-2 ring-line",
            )}
          >
            {step.state === "done" ? <Check size={14} weight="bold" /> : step.state === "current" ? <span className="size-2.5 rounded-full" /> : null}
          </span>
          <div className="-mt-0.5">
            <p className={cn("font-semibold", step.state === "upcoming" && "text-muted")}>
              {step.label}
              {step.state === "current" ? <span className="sr-only"> (current step)</span> : null}
            </p>
            {step.at ? <p className="text-xs text-muted">{formatDateTime(step.at)}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ShipmentPanel({ shipment }: { shipment: ShipmentView }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Truck size={20} className="text-navy-700" /> Shipment
      </p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted">Courier</dt>
        <dd className="font-semibold">{shipment.courierName ?? "To be assigned"}</dd>
        <dt className="text-muted">Tracking no. (AWB)</dt>
        <dd className="font-semibold tabular-nums">{shipment.awb ?? "To be assigned"}</dd>
        {shipment.providerStatus ? (
          <>
            <dt className="text-muted">Courier status</dt>
            <dd>{shipment.providerStatus}</dd>
          </>
        ) : null}
        {shipment.estimatedDelivery ? (
          <>
            <dt className="text-muted">Estimated delivery</dt>
            <dd>{formatDate(shipment.estimatedDelivery)}</dd>
          </>
        ) : null}
      </dl>
      {shipment.trackingUrl ? (
        <a
          href={shipment.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:underline"
        >
          Track on courier website <ArrowSquareOut size={14} />
        </a>
      ) : null}
      {shipment.events.length > 0 ? (
        <ol className="mt-4 space-y-3 border-t border-line pt-4">
          {shipment.events.slice(0, 12).map((event) => (
            <li key={event.id} className="text-sm">
              <p className="font-semibold">{event.description || event.providerStatus}</p>
              <p className="text-xs text-muted">
                {formatDateTime(event.occurredAt)}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

export function AddressBlock({ address, title = "Delivery address" }: { address: ShippingAddress; title?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold">
        <MapPin size={18} className="text-navy-700" /> {title}
      </p>
      <address className="mt-2 not-italic leading-relaxed">
        <span className="font-semibold">{address.fullName}</span>
        <br />
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ""}
        <br />
        {address.area ? `${address.area}, ` : ""}
        {address.city}, {address.state} {address.pincode}
        {address.landmark ? (
          <>
            <br />
            Landmark: {address.landmark}
          </>
        ) : null}
        <br />
        Phone: {address.phone}
      </address>
    </div>
  );
}

export function OrderItemsList({ order }: { order: OrderDetailView }) {
  return (
    <ul className="divide-y divide-line">
      {order.items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-3">
          <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-navy-50">
            {item.coverUrl ? <Image src={item.coverUrl} alt="" fill sizes="48px" className="object-contain p-0.5" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            {item.slug ? (
              <Link href={`/books/${item.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-navy-700">
                {item.title}
              </Link>
            ) : (
              <p className="line-clamp-2 text-sm font-semibold">{item.title}</p>
            )}
            <p className="text-xs text-muted tabular-nums">
              {item.quantity} × {formatPaise(item.unitPricePaise)}
            </p>
          </div>
          <p className="text-sm font-semibold tabular-nums">{formatPaise(item.lineTotalPaise)}</p>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ order, taxLabel = "GST" }: { order: OrderDetailView; taxLabel?: string }) {
  const rows: [string, string][] = [["Subtotal", formatPaise(order.subtotalPaise)]];
  if (order.discountPaise > 0) rows.push([`Coupon ${order.couponCode ?? ""}`.trim(), `- ${formatPaise(order.discountPaise)}`]);
  rows.push(["Shipping", order.shippingPaise === 0 ? "Free" : formatPaise(order.shippingPaise)]);
  if (order.codFeePaise > 0) rows.push(["Cash on delivery fee", formatPaise(order.codFeePaise)]);
  if (order.taxPaise > 0) {
    rows.push([
      `${taxLabel} ${order.pricesIncludeTax ? "included" : ""} (${order.taxRateBps / 100}%)`.replace("  ", " "),
      order.pricesIncludeTax ? formatPaise(order.taxPaise) : `+ ${formatPaise(order.taxPaise)}`,
    ]);
  }
  return (
    <dl className="space-y-1.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-muted">{label}</dt>
          <dd className="tabular-nums">{value}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t border-line pt-2 text-base">
        <dt className="font-semibold">Total</dt>
        <dd className="font-display font-extrabold tabular-nums">{formatPaise(order.totalPaise)}</dd>
      </div>
    </dl>
  );
}
