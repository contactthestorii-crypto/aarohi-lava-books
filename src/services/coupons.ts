import "server-only";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { CouponRule, CouponUsage } from "./pricing";

interface CouponRow {
  id: string;
  code: string;
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

export function normaliseCouponCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export async function findCoupon(code: string): Promise<CouponRule | null> {
  const normalised = normaliseCouponCode(code);
  if (!/^[A-Z0-9_-]{3,32}$/.test(normalised)) return null;
  const { data, error } = await getAdminSupabase()
    .from("coupons")
    .select(
      "id, code, type, value, max_discount_paise, min_order_paise, starts_at, expires_at, max_uses, per_customer_limit, applies_to, product_ids, category_ids, is_active",
    )
    .eq("code", normalised)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as CouponRow;
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value,
    maxDiscountPaise: row.max_discount_paise,
    minOrderPaise: row.min_order_paise,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    maxUses: row.max_uses,
    perCustomerLimit: row.per_customer_limit,
    appliesTo: row.applies_to,
    productIds: row.product_ids ?? [],
    categoryIds: row.category_ids ?? [],
    isActive: row.is_active,
  };
}

/** Usage counts: overall, and for this customer (matched by user, email or phone). */
export async function getCouponUsage(
  couponId: string,
  customer: { userId?: string | null; email?: string | null; phone?: string | null },
): Promise<CouponUsage> {
  const supabase = getAdminSupabase();
  const total = await supabase.from("coupon_usage").select("id", { count: "exact", head: true }).eq("coupon_id", couponId);
  if (total.error) throw total.error;

  const filters: string[] = [];
  // Values are validated upstream (uuid / email / 10-digit phone) and quoted for PostgREST.
  const quote = (value: string) => `"${value.replace(/["\\]/g, "")}"`;
  if (customer.userId) filters.push(`user_id.eq.${quote(customer.userId)}`);
  if (customer.email) filters.push(`customer_email.eq.${quote(customer.email.toLowerCase())}`);
  if (customer.phone) filters.push(`customer_phone.eq.${quote(customer.phone)}`);
  let byCustomer = 0;
  if (filters.length > 0) {
    const mine = await supabase
      .from("coupon_usage")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", couponId)
      .or(filters.join(","));
    if (mine.error) throw mine.error;
    byCustomer = mine.count ?? 0;
  }
  return { total: total.count ?? 0, byCustomer };
}
