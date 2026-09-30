import { FileText } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AddressBlock,
  OrderItemsList,
  OrderStatusBadge,
  OrderTimeline,
  OrderTotals,
  PaymentStatusBadge,
  ShipmentPanel,
  formatDateTime,
} from "@/components/orders/OrderViews";
import { RetryPaymentButton } from "@/components/checkout/RetryPaymentButton";
import { ButtonLink } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { canDownloadInvoice } from "@/lib/orders/invoice";
import { getOrderById } from "@/services/order-queries";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

const UUID = /^[0-9a-f-]{36}$/i;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/account/orders/${id}`);
  if (!UUID.test(id)) notFound();
  // User-session client: RLS returns nothing for another customer's order, so this 404s.
  const order = await getOrderById(await createServerSupabase(), id);
  if (!order) notFound();
  const settings = await getSettings();
  const shipment = order.shipments.find((s) => s.isActive) ?? order.shipments[0];

  return (
    <div>
      <Link href="/account/orders" className="text-sm font-semibold text-navy-700 hover:underline">
        Back to orders
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight tabular-nums">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      {order.status === "PENDING_PAYMENT" ? (
        <div className="mt-5 flex flex-col gap-3 rounded-[var(--radius-card)] border border-warning/30 bg-warning-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-warning">
            This order is waiting for payment. Unpaid orders are cancelled automatically after the payment window closes.
          </p>
          <RetryPaymentButton orderNumber={order.orderNumber} token={order.accessToken} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="rounded-[var(--radius-card)] border border-line p-5">
            <h2 className="mb-4 font-display text-lg font-extrabold">Progress</h2>
            <OrderTimeline order={order} />
          </section>
          <section className="rounded-[var(--radius-card)] border border-line p-5">
            <h2 className="font-display text-lg font-extrabold">Items</h2>
            <OrderItemsList order={order} />
            <div className="mt-3 border-t border-line pt-3">
              <OrderTotals order={order} taxLabel={settings.tax.label} />
            </div>
          </section>
        </div>
        <aside className="space-y-4">
          {shipment ? <ShipmentPanel shipment={shipment} /> : null}
          <AddressBlock address={order.shippingAddress} />
          {canDownloadInvoice(order) ? (
            <ButtonLink href={`/account/orders/${order.id}/invoice`} variant="secondary" className="w-full" icon={<FileText size={18} />}>
              View invoice
            </ButtonLink>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
