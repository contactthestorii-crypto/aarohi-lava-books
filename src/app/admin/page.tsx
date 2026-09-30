import { CheckCircle, Circle, WarningCircle } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { AdminCard, AdminPageHeader, StatTile } from "@/components/admin/AdminUI";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { OrderStatusBadge, formatDateTime } from "@/components/orders/OrderViews";
import { ErrorState } from "@/components/ui/States";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";
import { formatPaise } from "@/lib/utils/money";
import { getDashboard, getSetupChecklist } from "@/services/admin";
import { listOrdersForAdmin } from "@/services/order-queries";

export const dynamic = "force-dynamic";

async function load() {
  try {
    const [dashboard, checklist, recent] = await Promise.all([
      getDashboard(),
      getSetupChecklist(),
      listOrdersForAdmin(getAdminSupabase(), { pageSize: 8 }),
    ]);
    return { dashboard, checklist, recent: recent.items };
  } catch (error) {
    log.error("admin.dashboard", error);
    return null;
  }
}

export default async function AdminDashboard() {
  const data = await load();
  if (!data) return <ErrorState icon={<WarningCircle />} title="Dashboard data could not be loaded" description="Check the server logs and database connection." />;
  const { dashboard, checklist, recent } = data;
  const pendingSetup = checklist.filter((item) => !item.done);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Dashboard" description="Sales, orders and stock at a glance." />

      {pendingSetup.length > 0 ? (
        <AdminCard title={`Setup checklist (${checklist.length - pendingSetup.length}/${checklist.length} done)`}>
          <ul className="grid gap-2 md:grid-cols-2">
            {checklist.map((item) => (
              <li key={item.label} className="flex gap-2.5 text-sm">
                {item.done ? <CheckCircle size={20} weight="fill" className="shrink-0 text-success" /> : <Circle size={20} className="shrink-0 text-warning" />}
                <span>
                  {item.href ? (
                    <Link href={item.href} className="font-semibold hover:underline">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="font-semibold">{item.label}</span>
                  )}
                  {!item.done ? <span className="block text-muted">{item.detail}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </AdminCard>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Revenue (all time)" value={formatPaise(dashboard.allTime.revenue_paise)} hint={`${formatPaise(dashboard.last30.revenue_paise)} in the last 30 days`} />
        <StatTile label="Orders (all time)" value={dashboard.allTime.orders} hint={`${dashboard.last30.orders} in the last 30 days`} href="/admin/orders" />
        <StatTile label="To ship" value={dashboard.awaitingShipment} hint="Paid or COD, not shipped yet" href="/admin/orders?status=PAID" tone={dashboard.awaitingShipment > 0 ? "warning" : "default"} />
        <StatTile
          label="Need attention"
          value={dashboard.allTime.needs_attention}
          hint="Payment or stock issues to check"
          href="/admin/orders?status=attention"
          tone={dashboard.allTime.needs_attention > 0 ? "danger" : "default"}
        />
        <StatTile label="Awaiting payment" value={dashboard.allTime.pending_payment} href="/admin/orders?status=PENDING_PAYMENT" />
        <StatTile label="Paid" value={dashboard.allTime.paid} href="/admin/orders?status=PAID" />
        <StatTile label="Shipped" value={dashboard.allTime.shipped} href="/admin/orders?status=SHIPPED" />
        <StatTile label="Delivered" value={dashboard.allTime.delivered} href="/admin/orders?status=DELIVERED" />
      </div>

      <AdminCard title="Revenue">
        <RevenueChart data={dashboard.daily} />
      </AdminCard>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <AdminCard title="Recent orders" actions={<Link href="/admin/orders" className="text-sm font-semibold text-navy-700 hover:underline">All orders</Link>}>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((order) => (
                <li key={order.id}>
                  <Link href={`/admin/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:bg-navy-50">
                    <span>
                      <span className="font-semibold tabular-nums">{order.orderNumber}</span>
                      <span className="block text-xs text-muted">
                        {order.customerName}, {formatDateTime(order.createdAt)}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <OrderStatusBadge status={order.status} />
                      <span className="font-semibold tabular-nums">{formatPaise(order.totalPaise)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <div className="space-y-6">
          <AdminCard title="Best-selling books">
            {dashboard.bestSellers.length === 0 ? (
              <p className="text-sm text-muted">Appears after the first paid orders.</p>
            ) : (
              <ol className="space-y-2 text-sm">
                {dashboard.bestSellers.map((book) => (
                  <li key={book.product_id} className="flex justify-between gap-3">
                    <Link href={`/admin/books/${book.product_id}`} className="line-clamp-1 font-semibold hover:underline">
                      {book.title}
                    </Link>
                    <span className="shrink-0 tabular-nums text-muted">
                      {book.units} sold, {formatPaise(Number(book.revenue_paise))}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </AdminCard>
          <AdminCard title="Low stock">
            {dashboard.lowStock.length === 0 ? (
              <p className="text-sm text-muted">All books are above their low-stock level.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {dashboard.lowStock.slice(0, 8).map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <Link href={`/admin/books/${item.id}`} className="line-clamp-1 font-semibold hover:underline">
                      {item.title}
                    </Link>
                    <span className={item.stock.available === 0 ? "shrink-0 font-semibold text-danger" : "shrink-0 font-semibold text-warning"}>
                      {item.stock.available} available
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
