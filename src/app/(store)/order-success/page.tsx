import { CheckCircle, Clock, WarningCircle } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { RetryPaymentButton } from "@/components/checkout/RetryPaymentButton";
import { AutoRefresh } from "@/components/orders/AutoRefresh";
import {
  AddressBlock,
  OrderItemsList,
  OrderStatusBadge,
  OrderTimeline,
  OrderTotals,
  PaymentStatusBadge,
  ShipmentPanel,
} from "@/components/orders/OrderViews";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { orderAccessSchema } from "@/lib/validation/checkout";
import { getOrderWithToken } from "@/services/order-access";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ order?: string; token?: string }> };

export default async function OrderSuccessPage({ searchParams }: Props) {
  const parsed = orderAccessSchema.safeParse({ orderNumber: (await searchParams).order, token: (await searchParams).token });
  const order = parsed.success && isAdminClientConfigured() ? await getOrderWithToken(parsed.data.orderNumber, parsed.data.token).catch(() => null) : null;

  if (!order) {
    return (
      <div className="container-page py-10">
        <ErrorState
          icon={<WarningCircle />}
          title="We could not find that order"
          description="Open the link from your confirmation email, or track your order with the order ID and phone number."
          action={
            <ButtonLink href="/track-order" variant="secondary">
              Track order
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const settings = await getSettings();
  const pending = order.status === "PENDING_PAYMENT";
  const cancelled = order.status === "CANCELLED";
  const shipment = order.shipments.find((s) => s.isActive);

  return (
    <div className="container-page py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {pending ? (
            <Clock size={48} weight="duotone" className="text-warning" />
          ) : cancelled ? (
            <WarningCircle size={48} weight="duotone" className="text-danger" />
          ) : (
            <CheckCircle size={48} weight="fill" className="text-success" />
          )}
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              {pending ? "Payment not completed yet" : cancelled ? "This order was cancelled" : "Thank you, your order is confirmed"}
            </h1>
            <p className="mt-1 text-[15px] text-muted">
              Order <strong className="tabular-nums text-ink">{order.orderNumber}</strong>
              {!pending && !cancelled ? ` · Confirmation sent to ${order.customerEmail}` : ""}
            </p>
          </div>
        </div>

        {pending ? (
          <div className="mt-6 flex flex-col gap-4 rounded-[var(--radius-card)] border border-warning/30 bg-warning-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px] text-ink">
              Your books are reserved while you complete the payment. If money was debited, this page updates automatically within a few minutes once the bank confirms it.
            </p>
            <RetryPaymentButton orderNumber={order.orderNumber} token={order.accessToken} />
            <AutoRefresh />
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_18rem]">
          <div className="space-y-6">
            <section className="rounded-[var(--radius-card)] border border-line p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-extrabold">Status</h2>
                <div className="flex gap-2">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
              </div>
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
            <ButtonLink href="/books" variant="secondary" className="w-full">
              Continue shopping
            </ButtonLink>
            <ButtonLink href="/track-order" variant="ghost" className="w-full">
              Track order
            </ButtonLink>
          </aside>
        </div>
      </div>
    </div>
  );
}
