import { Package } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatusBadge, formatDate } from "@/components/orders/OrderViews";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { requireUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/utils/money";
import { listOrdersForUser } from "@/services/order-queries";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await listOrdersForUser(await createServerSupabase(), user.id);
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">My orders</h1>
      {orders.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Package />}
          title="No orders yet"
          description="Placed an order as a guest? Use Track order with your order ID."
          action={
            <ButtonLink href="/track-order" variant="secondary">
              Track order
            </ButtonLink>
          }
        />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-card)] border border-line">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="bg-navy-50 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-navy-50">
                  <td className="px-4 py-3">
                    <Link href={`/account/orders/${order.id}`} className="font-semibold text-navy-700 hover:underline">
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-muted">
                      {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                    </p>
                  </td>
                  <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatPaise(order.totalPaise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
