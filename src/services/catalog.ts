import "server-only";
import { PRODUCTS_PER_PAGE } from "@/lib/config";
import { getPublicSupabase } from "@/lib/supabase/public";
import { log } from "@/lib/utils/log";
import type { Banner, Category, CategoryKind, Faq, Paginated, Product, ProductSummary, Review } from "@/types";
import {
  CATEGORY_COLUMNS,
  PRODUCT_DETAIL_SELECT,
  PRODUCT_SUMMARY_SELECT,
  mapBanner,
  mapCategory,
  mapFaq,
  mapProduct,
  mapProductSummary,
  mapReview,
  type BannerRow,
  type CategoryRow,
  type ProductRow,
  type ProductSummaryRow,
  type ReviewRow,
} from "./mappers";

// Public, cacheable catalog reads (RLS: published products / active rows only).
// Every function degrades to an empty result when the store is not configured, so the
// storefront renders a clear state instead of crashing (docs/ARCHITECTURE.md).

export const SORT_OPTIONS = {
  featured: "Featured",
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  rating: "Top rated",
} as const;
export type SortOption = keyof typeof SORT_OPTIONS;

export interface ProductFilters {
  categorySlug?: string;
  exam?: string;
  language?: string;
  minPricePaise?: number;
  maxPricePaise?: number;
  inStockOnly?: boolean;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export class CatalogError extends Error {}

function emptyPage<T>(page = 1): Paginated<T> {
  return { items: [], total: 0, page, totalPages: 0 };
}

export async function getCategories(kind?: CategoryKind): Promise<Category[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  let query = supabase.from("categories").select(CATEGORY_COLUMNS).order("kind").order("sort_order").order("name");
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error) {
    log.error("catalog.getCategories", error);
    throw new CatalogError("Could not load categories");
  }
  return (data as CategoryRow[]).map(mapCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("categories").select(CATEGORY_COLUMNS).eq("slug", slug).maybeSingle();
  if (error) {
    log.error("catalog.getCategoryBySlug", error, { slug });
    throw new CatalogError("Could not load category");
  }
  return data ? mapCategory(data as CategoryRow) : null;
}

export async function listProducts(filters: ProductFilters = {}): Promise<Paginated<ProductSummary>> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? PRODUCTS_PER_PAGE;
  const supabase = getPublicSupabase();
  if (!supabase) return emptyPage(page);

  let categoryId: string | null = null;
  if (filters.categorySlug) {
    const category = await getCategoryBySlug(filters.categorySlug);
    if (!category) return emptyPage(page);
    categoryId = category.id;
  }

  let select = PRODUCT_SUMMARY_SELECT;
  if (categoryId) select += ", product_categories!inner(category_id)";
  // "In stock" needs a priced book with units on hand (reserved units are checked below).
  if (filters.inStockOnly) select += ", stock:inventory!inner(quantity)";
  let query = supabase.from("products").select(select, { count: "exact" }).eq("status", "published");

  if (categoryId) query = query.eq("product_categories.category_id", categoryId);
  if (filters.exam) query = query.contains("exams", [filters.exam]);
  if (filters.language) query = query.eq("language", filters.language);
  if (filters.minPricePaise !== undefined) query = query.gte("price_paise", filters.minPricePaise);
  if (filters.maxPricePaise !== undefined) query = query.lte("price_paise", filters.maxPricePaise);
  if (filters.inStockOnly) query = query.not("price_paise", "is", null).gt("stock.quantity", 0);

  switch (filters.sort ?? "featured") {
    case "newest":
      query = query.order("published_at", { ascending: false, nullsFirst: false });
      break;
    case "price_asc":
      query = query.order("price_paise", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price_paise", { ascending: false, nullsFirst: false });
      break;
    case "rating":
      query = query.order("rating_avg", { ascending: false }).order("rating_count", { ascending: false });
      break;
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("is_bestseller", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false });
  }
  query = query.order("id");

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) {
    log.error("catalog.listProducts", error, { filters });
    throw new CatalogError("Could not load books");
  }
  let items = (data as unknown as ProductSummaryRow[]).map(mapProductSummary);
  if (filters.inStockOnly) items = items.filter((p) => p.stock.state !== "out_of_stock");
  const total = count ?? items.length;
  return { items, total, page, totalPages: Math.ceil(total / pageSize) };
}

async function listFlagged(column: "is_featured" | "is_bestseller" | null, limit: number): Promise<ProductSummary[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  let query = supabase.from("products").select(PRODUCT_SUMMARY_SELECT).eq("status", "published");
  if (column) query = query.eq(column, true);
  const { data, error } = await query.order("published_at", { ascending: false, nullsFirst: false }).limit(limit);
  if (error) {
    log.error("catalog.listFlagged", error, { column });
    throw new CatalogError("Could not load books");
  }
  return (data as unknown as ProductSummaryRow[]).map(mapProductSummary);
}

export const getFeaturedProducts = (limit = 8) => listFlagged("is_featured", limit);
export const getBestsellers = (limit = 8) => listFlagged("is_bestseller", limit);
export const getNewArrivals = (limit = 8) => listFlagged(null, limit);

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) {
    log.error("catalog.getProductBySlug", error, { slug });
    throw new CatalogError("Could not load book");
  }
  return data ? mapProduct(data as unknown as ProductRow) : null;
}

/** Books sharing a category or exam with `product`, best matches first. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<ProductSummary[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const categoryIds = product.categories.map((c) => c.id);
  if (categoryIds.length === 0 && product.exams.length === 0) return [];

  let query = supabase
    .from("products")
    .select(`${PRODUCT_SUMMARY_SELECT}, product_categories!inner(category_id)`)
    .eq("status", "published")
    .neq("id", product.id);
  if (categoryIds.length > 0) query = query.in("product_categories.category_id", categoryIds);
  else query = query.overlaps("exams", product.exams);

  const { data, error } = await query.order("is_bestseller", { ascending: false }).limit(limit * 3);
  if (error) {
    log.error("catalog.getRelatedProducts", error, { productId: product.id });
    return [];
  }
  const seen = new Set<string>();
  const items: ProductSummary[] = [];
  for (const row of data as unknown as ProductSummaryRow[]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    items.push(mapProductSummary(row));
    if (items.length === limit) break;
  }
  return items;
}

export async function getApprovedReviews(productId: string, limit = 20): Promise<Review[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select("id, product_id, rating, title, body, author_name, verified_purchase, status, created_at")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    log.error("catalog.getApprovedReviews", error, { productId });
    return [];
  }
  return (data as ReviewRow[]).map(mapReview);
}

export async function getLatestApprovedReviews(limit = 6): Promise<(Review & { productTitle: string; productSlug: string })[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select("id, product_id, rating, title, body, author_name, verified_purchase, status, created_at, products(title, slug)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    log.error("catalog.getLatestApprovedReviews", error);
    return [];
  }
  type Row = ReviewRow & { products: { title: string; slug: string } | null };
  return (data as unknown as Row[])
    .filter((row) => row.products)
    .map((row) => ({ ...mapReview(row), productTitle: row.products!.title, productSlug: row.products!.slug }));
}

export async function searchProducts(query: string, page = 1, pageSize = PRODUCTS_PER_PAGE): Promise<Paginated<ProductSummary>> {
  const supabase = getPublicSupabase();
  const trimmed = query.trim().slice(0, 100);
  if (!supabase || trimmed.length < 2) return emptyPage(page);

  const { data: hits, error } = await supabase.rpc("search_product_ids", {
    p_query: trimmed,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) {
    log.error("catalog.searchProducts", error, { query: trimmed });
    throw new CatalogError("Search is unavailable right now");
  }
  const rows = (hits ?? []) as { product_id: string; rank: number; total_count: number }[];
  if (rows.length === 0) return emptyPage(page);

  const { data, error: productError } = await supabase
    .from("products")
    .select(PRODUCT_SUMMARY_SELECT)
    .in(
      "id",
      rows.map((r) => r.product_id),
    );
  if (productError) {
    log.error("catalog.searchProducts.load", productError);
    throw new CatalogError("Search is unavailable right now");
  }
  const byId = new Map((data as unknown as ProductSummaryRow[]).map((row) => [row.id, mapProductSummary(row)]));
  const items = rows.map((r) => byId.get(r.product_id)).filter((p): p is ProductSummary => Boolean(p));
  const total = Number(rows[0].total_count);
  return { items, total, page, totalPages: Math.ceil(total / pageSize) };
}

export async function getAllProductSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from("products").select("slug, updated_at").eq("status", "published");
  if (error) {
    log.error("catalog.getAllProductSlugs", error);
    return [];
  }
  return (data as { slug: string; updated_at: string }[]).map((r) => ({ slug: r.slug, updatedAt: r.updated_at }));
}

export async function getActiveBanners(placement: Banner["placement"]): Promise<Banner[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("banners")
    .select("id, placement, title, subtitle, image_url, link_url, link_label")
    .eq("placement", placement)
    .order("sort_order");
  if (error) {
    log.error("catalog.getActiveBanners", error);
    return [];
  }
  return (data as BannerRow[]).map(mapBanner);
}

export async function getFaqs(): Promise<Faq[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from("faqs").select("id, question, answer").order("sort_order");
  if (error) {
    log.error("catalog.getFaqs", error);
    return [];
  }
  return data.map(mapFaq);
}

export async function getLanguages(): Promise<string[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("products").select("language").eq("status", "published").not("language", "is", null);
  return [...new Set((data ?? []).map((r: { language: string }) => r.language))].sort();
}
