import type { Metadata } from "next";
import { toggleCouponAction } from "@/actions/admin/content";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUI";
import { CouponForm, type CouponValues } from "@/components/admin/ContentForms";
import { Badge } from "@/components/ui/Badge";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { toIstInput } from "@/lib/utils/dates";
import { formatPaise, paiseToRupeesInput } from "@/lib/utils/money";
import { listAllCategories } from "@/services/admin-catalog";

export const metadata: Metadata = { title: "Coupons" };
export const dynamic = "force-dynamic";

interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  type: "percent" | "fixed";
  value: number;
  max_discount_paise: number | null;
  min_order_paise: number;
  starts_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  per_customer_limit: number | null;
  applies_to: "all" | "products" | "categories";
  product_ids: string[];
  category_ids: string[];
  is_active: boolean;
}

function isPast(iso: string | null): boolean {
  return iso ? new Date(iso).getTime() < Date.now() : false;
}

export default async function AdminCouponsPage() {
  const supabase = await createServerSupabase();
  const [{ data: coupons }, { data: books }, categories, { data: usage }] = await Promise.all([
    supabase.from("coupons").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("id, title").neq("status", "archived").order("title"),
    listAllCategories(),
    getAdminSupabase().from("coupon_usage").select("coupon_id"),
  ]);
  const uses = new Map<string, number>();
  for (const row of usage ?? []) uses.set(row.coupon_id as string, (uses.get(row.coupon_id as string) ?? 0) + 1);
  const bookOptions = (books ?? []).map((b) => ({ id: b.id as string, title: b.title as string }));
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Coupons" description="Discount codes are validated on the server at cart and checkout." />
      <AdminCard title="Create coupon">
        <CouponForm books={bookOptions} categories={categoryOptions} />
      </AdminCard>
      <AdminCard title={`All coupons (${coupons?.length ?? 0})`}>
        {(coupons ?? []).length === 0 ? (
          <p className="text-sm text-muted">No coupons yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {(coupons as CouponRow[]).map((coupon) => {
              const expired = isPast(coupon.expires_at);
              const value: CouponValues = {
                id: coupon.id,
                code: coupon.code,
                description: coupon.description,
                type: coupon.type,
                value: coupon.type === "percent" ? String(coupon.value) : paiseToRupeesInput(coupon.value),
                maxDiscount: paiseToRupeesInput(coupon.max_discount_paise),
                minOrder: paiseToRupeesInput(coupon.min_order_paise || null),
                startsAt: toIstInput(coupon.starts_at),
                expiresAt: toIstInput(coupon.expires_at),
                maxUses: coupon.max_uses?.toString() ?? "",
                perCustomerLimit: coupon.per_customer_limit?.toString() ?? "",
                appliesTo: coupon.applies_to,
                productIds: coupon.product_ids,
                categoryIds: coupon.category_ids,
                isActive: coupon.is_active,
              };
              return (
                <li key={coupon.id} className="py-3">
                  <details>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                      <span>
                        <span className="font-mono font-bold">{coupon.code}</span>{" "}
                        <span className="text-sm text-muted">
                          {coupon.type === "percent" ? `${coupon.value}% off` : `${formatPaise(coupon.value)} off`}
                          {coupon.min_order_paise ? `, min ${formatPaise(coupon.min_order_paise)}` : ""}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-sm">
                        <span className="text-muted">
                          Used {uses.get(coupon.id) ?? 0}
                          {coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
                        </span>
                        {expired ? <Badge tone="neutral">expired</Badge> : coupon.is_active ? <Badge tone="success">active</Badge> : <Badge tone="warning">inactive</Badge>}
                        <span className="font-semibold text-navy-700">Edit</span>
                      </span>
                    </summary>
                    <div className="mt-4 rounded-[var(--radius-control)] bg-navy-50 p-4">
                      <CouponForm value={value} books={bookOptions} categories={categoryOptions} />
                      <div className="mt-4 border-t border-line pt-4">
                        <ActionButton action={toggleCouponAction.bind(null, coupon.id, !coupon.is_active)}>{coupon.is_active ? "Deactivate" : "Activate"}</ActionButton>
                      </div>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
