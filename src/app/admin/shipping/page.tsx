import type { Metadata } from "next";
import Link from "next/link";
import { AdminCard, AdminPageHeader, AdminTable, EmptyRow, Td } from "@/components/admin/AdminUI";
import { OrderStatusBadge, formatDateTime } from "@/components/orders/OrderViews";
import { Badge } from "@/components/ui/Badge";
import { siteUrl } from "@/lib/config";
import { shippingProviderName, shiprocketConfig } from "@/lib/env";
import { getShippingProvider } from "@/lib/shipping";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/types";

export const metadata: Metadata = { title: "Shipping" };
export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  const supabase = getAdminSupabase();
  const [{ data: toShip }, { data: shipments }] = await Promise.all([
    supabase.from("orders").select("id, order_number, status, customer_name, shipping_pincode, created_at, shipments(id, is_active)").in("status", ["PAID", "PROCESSING", "PACKED"]).order("created_at").limit(100),
    supabase.from("shipments").select("id, order_id, provider, awb, courier_name, status, provider_status, last_synced_at, created_at, orders(order_number)").eq("is_active", true).order("created_at", { ascending: false }).limit(50),
  ]);
  const provider = getShippingProvider();
  const configured = shiprocketConfig();
  type ToShip = { id: string; order_number: string; status: OrderStatus; customer_name: string; shipping_pincode: string; created_at: string; shipments: { id: string; is_active: boolean }[] };
  type ShipmentRow = { id: string; order_id: string; provider: string; awb: string | null; courier_name: string | null; status: OrderStatus | null; provider_status: string | null; last_synced_at: string | null; orders: { order_number: string } | null };
  const pending = ((toShip ?? []) as ToShip[]).filter((o) => !o.shipments.some((s) => s.is_active));

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Shipping" description="Orders waiting to ship and active shipments." />
      <AdminCard title="Provider">
        <dl className="grid gap-2 text-sm sm:grid-cols-[12rem_1fr]">
          <dt className="text-muted">Selected (SHIPPING_PROVIDER)</dt>
          <dd className="font-semibold">{shippingProviderName()}</dd>
          <dt className="text-muted">In use</dt>
          <dd>
            <Badge tone={provider.automated ? "success" : "warning"}>{provider.name}</Badge>
            {shippingProviderName() === "shiprocket" && !configured.configured ? (
              <span className="ml-2 text-danger">Shiprocket credentials or pickup details missing, falling back to manual.</span>
            ) : null}
          </dd>
          <dt className="text-muted">Tracking webhook URL</dt>
          <dd className="break-all font-mono text-xs">{siteUrl}/api/webhooks/shiprocket</dd>
          <dt className="text-muted">Webhook token set</dt>
          <dd>{configured.webhookToken ? "Yes" : "No (SHIPROCKET_WEBHOOK_TOKEN)"}</dd>
        </dl>
        {!provider.automated ? (
          <p className="mt-3 text-sm text-muted">
            Manual mode: book the courier yourself, then open the order and enter the courier and AWB. The customer is emailed and can track it.
          </p>
        ) : null}
      </AdminCard>

      <div>
        <h2 className="mb-3 font-display text-lg font-extrabold">Waiting to ship ({pending.length})</h2>
        <AdminTable head={["Order", "Customer", "Pincode", "Status", "Placed"]}>
          {pending.length === 0 ? (
            <EmptyRow colSpan={5}>Nothing to ship right now.</EmptyRow>
          ) : (
            pending.map((order) => (
              <tr key={order.id}>
                <Td>
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold text-navy-700 hover:underline">
                    {order.order_number}
                  </Link>
                </Td>
                <Td>{order.customer_name}</Td>
                <Td className="tabular-nums">{order.shipping_pincode}</Td>
                <Td>
                  <OrderStatusBadge status={order.status} />
                </Td>
                <Td className="text-muted">{formatDateTime(order.created_at)}</Td>
              </tr>
            ))
          )}
        </AdminTable>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-extrabold">Active shipments</h2>
        <AdminTable head={["Order", "Courier", "AWB", "Status", "Last synced"]}>
          {(shipments ?? []).length === 0 ? (
            <EmptyRow colSpan={5}>No shipments yet.</EmptyRow>
          ) : (
            ((shipments ?? []) as unknown as ShipmentRow[]).map((s) => (
              <tr key={s.id}>
                <Td>
                  <Link href={`/admin/orders/${s.order_id}`} className="font-semibold text-navy-700 hover:underline">
                    {s.orders?.order_number}
                  </Link>
                </Td>
                <Td>
                  {s.courier_name ?? "-"} <span className="text-xs text-muted">({s.provider})</span>
                </Td>
                <Td className="font-mono text-xs">{s.awb ?? "-"}</Td>
                <Td>
                  {s.status ? <OrderStatusBadge status={s.status} /> : null}
                  {s.provider_status ? <span className="block text-xs text-muted">{s.provider_status}</span> : null}
                </Td>
                <Td className="text-muted">{s.last_synced_at ? formatDateTime(s.last_synced_at) : "-"}</Td>
              </tr>
            ))
          )}
        </AdminTable>
      </div>
    </div>
  );
}
