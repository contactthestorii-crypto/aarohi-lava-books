import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Category, Product } from "@/types";
import {
  CATEGORY_COLUMNS,
  PRODUCT_DETAIL_SELECT,
  computeStock,
  mapCategory,
  mapProduct,
  type CategoryRow,
  type InventoryRow,
  type ProductRow,
} from "./mappers";

// Admin catalog reads through the admin's session: RLS "admin all" policies expose drafts
// and archived books only to admins.

export async function listAllCategories(): Promise<Category[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("categories").select(CATEGORY_COLUMNS).order("kind").order("sort_order").order("name");
  if (error) throw error;
  return (data as CategoryRow[]).map(mapCategory);
}

export async function listAdminBooks(filters: { q?: string; status?: string }) {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("products")
    .select("id, slug, title, author, isbn, sku, status, price_paise, mrp_paise, is_featured, updated_at, product_images(url, sort_order), inventory(quantity, reserved, low_stock_threshold, allow_backorder)")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (filters.status && ["draft", "published", "archived"].includes(filters.status)) query = query.eq("status", filters.status);
  else query = query.neq("status", "archived");
  const q = filters.q?.trim().replace(/[,()"\\%]/g, "");
  if (q) query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%,isbn.ilike.%${q}%,sku.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) throw error;
  type Row = {
    id: string;
    slug: string;
    title: string;
    author: string | null;
    isbn: string | null;
    sku: string | null;
    status: string;
    price_paise: number | null;
    mrp_paise: number | null;
    is_featured: boolean;
    updated_at: string;
    product_images: { url: string; sort_order: number }[] | null;
    inventory: InventoryRow | InventoryRow[] | null;
  };
  return (data as unknown as Row[]).map((row) => {
    const inventory = Array.isArray(row.inventory) ? row.inventory[0] ?? null : row.inventory;
    const cover = [...(row.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
    return { ...row, cover, inventory, stock: computeStock(inventory) };
  });
}

export async function getAdminBook(id: string): Promise<{ product: Product; inventory: InventoryRow } | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("products").select(PRODUCT_DETAIL_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as ProductRow;
  const inventory = (Array.isArray(row.inventory) ? row.inventory[0] : row.inventory) ?? { quantity: 0, reserved: 0, low_stock_threshold: 5, allow_backorder: false };
  return { product: mapProduct(row), inventory };
}
