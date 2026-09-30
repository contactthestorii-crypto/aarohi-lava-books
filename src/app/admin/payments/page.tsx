import type { Metadata } from "next";
import Link from "next/link";
import { AdminCard, AdminPageHeader, AdminTable, EmptyRow, Td } from "@/components/admin/AdminUI";
import { PaymentStatusBadge, formatDateTime } from "@/components/orders/OrderViews";
import { Badge } from "@/components/ui/Badge";
import { siteUrl } from "@/lib/config";
import { isProductionDeployment, paymentProviderName, razorpayConfig } from "@/lib/env";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { formatPaise } from "@/lib/utils/money";
import type { PaymentStatus } from "@/types";

export const metadata: Metadata = { title: "Payments" };
export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const supabase = getAdminSupabase();
  const [{ data: payments }, { data: events }] = await Promise.all([
    supabase.from("payments").select("id, order_id, provider, method, status, amount_paise, refunded_paise, provider_payment_id, error_description, created_at, orders(order_number)").order("created_at", { ascending: false }).limit(50),
    supabase.from("webhook_events").select("id, provider, event_type, processed_at, error, created_at").order("created_at", { ascending: false }).limit(20),
  ]);
  const razorpay = razorpayConfig();
  const mode = paymentProviderName();
  const liveKey = razorpay.keyId.startsWith("rzp_live_");
  type PaymentRow = { id: string; order_id: string; provider: string; method: string; status: PaymentStatus; amount_paise: number; refunded_paise: number; provider_payment_id: string | null; error_description: string | null; created_at: string; orders: { order_number: string } | null };
  type EventRow = { id: number; provider: string; event_type: string; processed_at: string | null; error: string | null; created_at: string };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Payments" description="Gateway configuration, recent payments and webhook deliveries." />
      <AdminCard title="Gateway">
        <dl className="grid gap-2 text-sm sm:grid-cols-[12rem_1fr]">
          <dt className="text-muted">Mode</dt>
          <dd>
            {mode === "mock" ? <Badge tone="warning">Test mode (mock)</Badge> : <Badge tone="brand">Razorpay</Badge>}
            {mode === "mock" && isProductionDeployment ? <span className="ml-2 text-danger">Mock is refused on production: online payments are off.</span> : null}
          </dd>
          <dt className="text-muted">Key ID</dt>
          <dd className="font-mono text-xs">{razorpay.keyId ? `${razorpay.keyId.slice(0, 12)}…` : "Not set"} {razorpay.keyId ? <Badge tone={liveKey ? "success" : "warning"}>{liveKey ? "live" : "test"}</Badge> : null}</dd>
          <dt className="text-muted">Key secret</dt>
          <dd>{razorpay.keySecret ? "Set" : "Not set"}</dd>
          <dt className="text-muted">Webhook secret</dt>
          <dd>{razorpay.webhookSecret ? "Set" : "Not set"}</dd>
          <dt className="text-muted">Webhook URL</dt>
          <dd className="break-all font-mono text-xs">{siteUrl}/api/webhooks/razorpay</dd>
          <dt className="text-muted">Webhook events</dt>
          <dd className="text-xs">payment.captured, order.paid, payment.failed, refund.processed</dd>
        </dl>
      </AdminCard>

      <div>
        <h2 className="mb-3 font-display text-lg font-extrabold">Recent payments</h2>
        <AdminTable head={["Order", "Method", "Amount", "Status", "Gateway ref", "Date"]}>
          {(payments ?? []).length === 0 ? (
            <EmptyRow colSpan={6}>No payments yet.</EmptyRow>
          ) : (
            ((payments ?? []) as unknown as PaymentRow[]).map((p) => (
              <tr key={p.id}>
                <Td>
                  <Link href={`/admin/orders/${p.order_id}`} className="font-semibold text-navy-700 hover:underline">
                    {p.orders?.order_number}
                  </Link>
                </Td>
                <Td>
                  {p.method === "cod" ? "COD" : p.provider}
                </Td>
                <Td className="tabular-nums">
                  {formatPaise(p.amount_paise)}
                  {p.refunded_paise ? <span className="block text-xs text-muted">refunded {formatPaise(p.refunded_paise)}</span> : null}
                </Td>
                <Td>
                  <PaymentStatusBadge status={p.status} />
                  {p.error_description ? <span className="block text-xs text-danger">{p.error_description}</span> : null}
                </Td>
                <Td className="font-mono text-xs">{p.provider_payment_id ?? "-"}</Td>
                <Td className="text-muted">{formatDateTime(p.created_at)}</Td>
              </tr>
            ))
          )}
        </AdminTable>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-extrabold">Webhook deliveries</h2>
        <AdminTable head={["Provider", "Event", "Result", "Received"]}>
          {(events ?? []).length === 0 ? (
            <EmptyRow colSpan={4}>No webhooks received yet.</EmptyRow>
          ) : (
            ((events ?? []) as EventRow[]).map((e) => (
              <tr key={e.id}>
                <Td>{e.provider}</Td>
                <Td className="font-mono text-xs">{e.event_type}</Td>
                <Td>{e.error ? <span className="text-danger">{e.error}</span> : e.processed_at ? <Badge tone="success">processed</Badge> : <Badge tone="warning">pending</Badge>}</Td>
                <Td className="text-muted">{formatDateTime(e.created_at)}</Td>
              </tr>
            ))
          )}
        </AdminTable>
      </div>
    </div>
  );
}
