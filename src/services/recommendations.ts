import "server-only";
import { unstable_cache } from "next/cache";
import { getAdminSupabase, isAdminClientConfigured } from "@/lib/supabase/admin";
import { CATALOG_TAG } from "@/lib/supabase/public";
import { log } from "@/lib/utils/log";
import type { ProductSummary } from "@/types";
import { PRODUCT_SUMMARY_SELECT, mapProductSummary, type ProductSummaryRow } from "./mappers";

const PAID_STATUSES = ["PAID", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

/**
 * Books that appear in the same paid orders as `productId`, ranked by how often.
 * Returns nothing until real co-purchase data exists (never fabricated).
 */
async function computeBoughtTogether(productId: string, limit: number): Promise<ProductSummary[]> {
  if (!isAdminClientConfigured()) return [];
  const supabase = getAdminSupabase();
  const { data: orders, error } = await supabase
    .from("order_items")
    .select("order_id, orders!inner(status)")
    .eq("product_id", productId)
    .in("orders.status", PAID_STATUSES)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    log.error("recommendations.orders", error);
    return [];
  }
  const orderIds = [...new Set((orders ?? []).map((row) => row.order_id as string))];
  if (orderIds.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_id")
    .in("order_id", orderIds)
    .neq("product_id", productId);
  if (itemsError) {
    log.error("recommendations.items", itemsError);
    return [];
  }
  const counts = new Map<string, number>();
  for (const row of items ?? []) {
    if (row.product_id) counts.set(row.product_id as string, (counts.get(row.product_id as string) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
  if (top.length === 0) return [];

  const { data: products } = await supabase.from("products").select(PRODUCT_SUMMARY_SELECT).in("id", top).eq("status", "published");
  const byId = new Map((products as unknown as ProductSummaryRow[] | null ?? []).map((row) => [row.id, mapProductSummary(row)]));
  return top.map((id) => byId.get(id)).filter((p): p is ProductSummary => Boolean(p));
}

export const getFrequentlyBoughtTogether = unstable_cache(computeBoughtTogether, ["bought-together"], {
  revalidate: 3600,
  tags: [CATALOG_TAG],
});
