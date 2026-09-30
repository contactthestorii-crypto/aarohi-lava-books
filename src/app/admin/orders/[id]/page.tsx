import { ArrowsClockwise, FileText, Package, Printer } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createShipmentAction, syncTrackingAction } from "@/actions/admin/orders";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUI";
import { AdminNoteForm, CancelForm, ManualShipmentForm, RefundForm, StatusForm, TrackingEventForm } from "@/components/admin/OrderAdminForms";
import {
  AddressBlock,
  OrderItemsList,
  OrderStatusBadge,
  OrderTotals,
  PaymentStatusBadge,
  ShipmentPanel,
  formatDateTime,
} from "@/components/orders/OrderViews";
import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/States";
import { getShippingProvider } from "@/lib/shipping";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { formatPaise } from "@/lib/utils/money";
import { getOrderById } from "@/services/order-queries";
import { MANUAL_TRANSITIONS } from "@/services/orders";

export const metadata: Metadata = { title: "Order" };
export const dynamic = "force-dynamic";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const order = await getOrderById(getAdminSupabase(), id);
  if (!order) notFound();

  const shipment = order.shipments.find((s) => s.isActive);
  const provider = getShippingProvider();
  const canShip = ["PAID", "PROCESSING", "PACKED"].includes(order.status);
  const cancellable = !["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED", "RETURN_REQUESTED", "RETURNED"].includes(order.status);
  const onlinePayment = order.payments.find((p) => p.method === "online" && (p.status === "captured" || p.status === "partially_refunded"));
  const refundable = onlinePayment ? onlinePayment.amountPaise - onlinePayment.refundedPaise : 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        back={{ href: "/admin/orders", label: "Back to orders" }}
        actions={
          <>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
            <ButtonLink href={`/admin/orders/${order.id}/invoice`} variant="secondary" size="sm" icon={<FileText size={16} />}>
              Invoice
            </ButtonLink>
            {shipment?.labelUrl ? (
              <ButtonLink href={shipment.labelUrl} target="_blank" variant="secondary" size="sm" icon={<Printer size={16} />}>
                Shipping label
              </ButtonLink>
            ) : null}
          </>
        }
      />
      {order.needsAttention ? <Notice tone="error">This order needs attention. {order.adminNote ?? ""}</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <AdminCard title="Items">
            <OrderItemsList order={order} />
            <div className="mt-3 border-t border-line pt-3">
              <OrderTotals order={order} />
            </div>
          </AdminCard>

          <div className="grid gap-6 md:grid-cols-2">
            <AdminCard title="Customer">
              <p className="font-semibold">{order.customerName}</p>
              <p className="text-sm">
                <a href={`tel:${order.customerPhone}`} className="text-navy-700 hover:underline">
                  {order.customerPhone}
                </a>
              </p>
              <p className="text-sm">
                <a href={`mailto:${order.customerEmail}`} className="text-navy-700 hover:underline">
                  {order.customerEmail}
                </a>
              </p>
              <p className="mt-2 text-xs text-muted">{order.userId ? "Registered customer" : "Guest checkout"}</p>
              {order.customerNote ? <p className="mt-3 rounded bg-navy-50 p-2 text-sm">Note: {order.customerNote}</p> : null}
            </AdminCard>
            <AddressBlock address={order.shippingAddress} title="Ship to" />
          </div>

          <AdminCard title="Payments">
            {order.payments.length === 0 ? (
              <p className="text-sm text-muted">No payment records.</p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {order.payments.map((payment) => (
                  <li key={payment.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span>
                      <span className="font-semibold capitalize">{payment.provider}</span> · {payment.method === "cod" ? "Cash on delivery" : "Online"}
                      {payment.providerPaymentId ? <span className="block text-xs text-muted">Payment {payment.providerPaymentId}</span> : null}
                      {payment.providerOrderId ? <span className="block text-xs text-muted">Gateway order {payment.providerOrderId}</span> : null}
                      {payment.errorDescription ? <span className="block text-xs text-danger">{payment.errorDescription}</span> : null}
                    </span>
                    <span className="text-right">
                      <PaymentStatusBadge status={payment.status} />
                      <span className="block tabular-nums">{formatPaise(payment.amountPaise)}</span>
                      {payment.refundedPaise > 0 ? <span className="block text-xs text-muted">Refunded {formatPaise(payment.refundedPaise)}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard title="Timeline">
            <ol className="space-y-3 text-sm">
              {order.events.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <span className="w-36 shrink-0 text-xs text-muted">{formatDateTime(event.createdAt)}</span>
                  <span>
                    {event.status ? <OrderStatusBadge status={event.status} /> : null} {event.message}
                    <span className="ml-1 text-xs text-muted">({event.actor})</span>
                  </span>
                </li>
              ))}
            </ol>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Shipping">
            {shipment ? (
              <div className="space-y-3">
                <ShipmentPanel shipment={shipment} />
                {provider.automated && shipment.provider !== "manual" ? (
                  <ActionButton action={syncTrackingAction.bind(null, order.id)} icon={<ArrowsClockwise size={16} />}>
                    Sync tracking
                  </ActionButton>
                ) : (
                  <TrackingEventForm orderId={order.id} />
                )}
              </div>
            ) : canShip ? (
              <div className="space-y-5">
                {provider.automated ? (
                  <div>
                    <p className="mb-2 text-sm text-muted">Create the shipment in {provider.name} and get an AWB automatically.</p>
                    <ActionButton action={createShipmentAction.bind(null, order.id)} variant="primary" icon={<Package size={16} />}>
                      Create shipment
                    </ActionButton>
                  </div>
                ) : null}
                <div>
                  <p className="mb-2 text-sm font-semibold">{provider.automated ? "Or enter a shipment booked elsewhere" : "Shipped it yourself? Enter the details"}</p>
                  <ManualShipmentForm orderId={order.id} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">{order.status === "PENDING_PAYMENT" ? "Ship after payment is confirmed." : "No shipment."}</p>
            )}
          </AdminCard>

          <AdminCard title="Update status">
            <StatusForm orderId={order.id} allowed={MANUAL_TRANSITIONS[order.status] ?? []} />
          </AdminCard>

          <AdminCard title="Internal note">
            <AdminNoteForm orderId={order.id} note={order.adminNote ?? ""} needsAttention={order.needsAttention} />
          </AdminCard>

          {refundable > 0 ? (
            <AdminCard title="Refund">
              <RefundForm orderId={order.id} maxRupees={(refundable / 100).toFixed(2)} />
            </AdminCard>
          ) : null}

          {cancellable ? (
            <AdminCard title="Cancel order">
              <CancelForm orderId={order.id} paidOnline={Boolean(onlinePayment)} />
            </AdminCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
