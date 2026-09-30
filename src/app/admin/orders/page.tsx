import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, AdminTable, EmptyRow, Td } from "@/components/admin/AdminUI";
import { OrderStatusBadge, PaymentStatusBadge, formatDateTime } from "@/components/orders/OrderViews";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { ORDER_STATUS_LABEL } from "@/lib/orders/status";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils/cn";
import { formatPaise } from "@/lib/utils/money";
import { listOrdersForAdmin } from "@/services/order-queries";
import { ORDER_STATUSES, type OrderStatus } from "@/types";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const TABS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "attention", label: "Needs attention" },
  { value: "PAID", label: "Paid (to ship)" },
  { value: "PROCESSING", label: "Processing" },
  { value: "PACKED", label: "Packed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "PENDING_PAYMENT", label: "Awaiting payment" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const params = await searchParams;
  const status = params.status === "attention" || ORDER_STATUSES.includes(params.status as OrderStatus) ? (params.status as OrderStatus | "attention") : undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const result = await listOrdersForAdmin(getAdminSupabase(), { status, q: params.q, page });

  const href = (overrides: Record<string, string | number | undefined>) => {
    const search = new URLSearchParams();
    const merged = { status: status ?? "", q: params.q ?? "", ...overrides };
    for (const [key, value] of Object.entries(merged)) if (value) search.set(key, String(value));
    const query = search.toString();
    return query ? `/admin/orders?${query}` : "/admin/orders";
  };

  return (
    <div>
      <AdminPageHeader title="Orders" description={`${result.total} ${result.total === 1 ? "order" : "orders"}${status ? ` · ${status === "attention" ? "needs attention" : ORDER_STATUS_LABEL[status]}` : ""}`} />
      <nav aria-label="Order status" className="scrollbar-none mb-4 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={href({ status: tab.value, page: undefined })}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold",
              (status ?? "") === tab.value ? "bg-navy-900 text-white" : "bg-white text-ink ring-1 ring-line hover:bg-navy-50",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <form method="get" className="mb-4 flex gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <Input name="q" defaultValue={params.q} placeholder="Order ID, name, phone or email" className="max-w-sm" aria-label="Search orders" />
        <button type="submit" className="h-11 rounded-[var(--radius-control)] bg-navy-900 px-4 text-sm font-semibold text-white">
          Search
        </button>
      </form>
      <AdminTable head={["Order", "Customer", "Items", "Amount", "Payment", "Status", "Placed"]}>
        {result.items.length === 0 ? (
          <EmptyRow colSpan={7}>No orders found.</EmptyRow>
        ) : (
          result.items.map((order) => (
            <tr key={order.id} className="hover:bg-navy-50">
              <Td>
                <Link href={`/admin/orders/${order.id}`} className="font-semibold tabular-nums text-navy-700 hover:underline">
                  {order.orderNumber}
                </Link>
                {order.needsAttention ? <Badge tone="danger" className="ml-2">attention</Badge> : null}
              </Td>
              <Td>
                <span className="font-semibold">{order.customerName}</span>
                <span className="block text-xs text-muted">{order.customerPhone}</span>
              </Td>
              <Td className="tabular-nums">{order.itemCount}</Td>
              <Td className="font-semibold tabular-nums">{formatPaise(order.totalPaise)}</Td>
              <Td>
                <PaymentStatusBadge status={order.paymentStatus} />
                <span className="block text-xs text-muted">{order.paymentMethod === "cod" ? "COD" : "Online"}</span>
              </Td>
              <Td>
                <OrderStatusBadge status={order.status} />
              </Td>
              <Td className="whitespace-nowrap text-muted">{formatDateTime(order.createdAt)}</Td>
            </tr>
          ))
        )}
      </AdminTable>
      <div className="mt-6">
        <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(p) => href({ page: p > 1 ? p : undefined })} />
      </div>
    </div>
  );
}
