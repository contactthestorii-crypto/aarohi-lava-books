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

import { DEFAULT_EXAMS, DEFAULT_FAQS, DEFAULT_REVIEWS, DEFAULT_SUBJECTS, FALLBACK_PRODUCT, FALLBACK_PRODUCT_SUMMARY } from "@/lib/content/default-catalog";
import { FEATURED_BOOK } from "@/lib/content/featured-book";

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
  if (!supabase) {
    if (!kind) return [...DEFAULT_EXAMS, ...DEFAULT_SUBJECTS];
    if (kind === "exam") return DEFAULT_EXAMS;
    return DEFAULT_SUBJECTS;
  }
  let query = supabase.from("categories").select(CATEGORY_COLUMNS).order("kind").order("sort_order").order("name");
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error) {
    log.error("catalog.getCategories", error);
    if (!kind) return [...DEFAULT_EXAMS, ...DEFAULT_SUBJECTS];
    if (kind === "exam") return DEFAULT_EXAMS;
    return DEFAULT_SUBJECTS;
  }
  const mapped = (data as CategoryRow[]).map(mapCategory);
  return mapped.length > 0 ? mapped : kind === "exam" ? DEFAULT_EXAMS : kind === "subject" ? DEFAULT_SUBJECTS : [...DEFAULT_EXAMS, ...DEFAULT_SUBJECTS];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = getPublicSupabase();
  if (!supabase) {
    return DEFAULT_EXAMS.find((e) => e.slug === slug) ?? DEFAULT_SUBJECTS.find((s) => s.slug === slug) ?? null;
  }
  const { data, error } = await supabase.from("categories").select(CATEGORY_COLUMNS).eq("slug", slug).maybeSingle();
  if (error) {
    log.error("catalog.getCategoryBySlug", error, { slug });
    return DEFAULT_EXAMS.find((e) => e.slug === slug) ?? DEFAULT_SUBJECTS.find((s) => s.slug === slug) ?? null;
  }
  return data ? mapCategory(data as CategoryRow) : DEFAULT_EXAMS.find((e) => e.slug === slug) ?? DEFAULT_SUBJECTS.find((s) => s.slug === slug) ?? null;
}

export async function listProducts(filters: ProductFilters = {}): Promise<Paginated<ProductSummary>> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? PRODUCTS_PER_PAGE;
  const supabase = getPublicSupabase();
  if (!supabase) {
    let items = [FALLBACK_PRODUCT_SUMMARY];
    if (filters.categorySlug) {
      const cat = DEFAULT_EXAMS.find((e) => e.slug === filters.categorySlug) ?? DEFAULT_SUBJECTS.find((s) => s.slug === filters.categorySlug);
      if (!cat) return emptyPage(page);
    }
    if (filters.exam && !FALLBACK_PRODUCT_SUMMARY.exams.includes(filters.exam)) {
      items = [];
    }
    return { items, total: items.length, page, totalPages: Math.ceil(items.length / pageSize) };
  }

  let categoryId: string | null = null;
  if (filters.categorySlug) {
    const category = await getCategoryBySlug(filters.categorySlug);
    if (!category) return emptyPage(page);
    categoryId = category.id;
  }

  let select = PRODUCT_SUMMARY_SELECT;
  if (categoryId) select += ", product_categories!inner(category_id)";
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
    return { items: [FALLBACK_PRODUCT_SUMMARY], total: 1, page: 1, totalPages: 1 };
  }
  let items = (data as unknown as ProductSummaryRow[]).map(mapProductSummary);
  if (items.length === 0) items = [FALLBACK_PRODUCT_SUMMARY];
  if (filters.inStockOnly) items = items.filter((p) => p.stock.state !== "out_of_stock");
  const total = count ?? items.length;
  return { items, total, page, totalPages: Math.ceil(total / pageSize) };
}

async function listFlagged(column: "is_featured" | "is_bestseller" | null, limit: number): Promise<ProductSummary[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [FALLBACK_PRODUCT_SUMMARY];
  let query = supabase.from("products").select(PRODUCT_SUMMARY_SELECT).eq("status", "published");
  if (column) query = query.eq(column, true);
  const { data, error } = await query.order("published_at", { ascending: false, nullsFirst: false }).limit(limit);
  if (error) {
    log.error("catalog.listFlagged", error, { column });
    return [FALLBACK_PRODUCT_SUMMARY];
  }
  const items = (data as unknown as ProductSummaryRow[]).map(mapProductSummary);
  return items.length > 0 ? items : [FALLBACK_PRODUCT_SUMMARY];
}

export const getFeaturedProducts = (limit = 8) => listFlagged("is_featured", limit);
export const getBestsellers = (limit = 8) => listFlagged("is_bestseller", limit);
export const getNewArrivals = (limit = 8) => listFlagged(null, limit);

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = getPublicSupabase();
  if (!supabase) {
    if (slug === FEATURED_BOOK.slug || slug.includes("target-police")) return FALLBACK_PRODUCT;
    return null;
  }
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) {
    log.error("catalog.getProductBySlug", error, { slug });
    if (slug === FEATURED_BOOK.slug || slug.includes("target-police")) return FALLBACK_PRODUCT;
    return null;
  }
  return data ? mapProduct(data as unknown as ProductRow) : slug === FEATURED_BOOK.slug || slug.includes("target-police") ? FALLBACK_PRODUCT : null;
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
  if (!supabase) return DEFAULT_REVIEWS as unknown as Review[];
  const { data, error } = await supabase
    .from("reviews")
    .select("id, product_id, rating, title, body, author_name, verified_purchase, status, created_at")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    log.error("catalog.getApprovedReviews", error, { productId });
    return DEFAULT_REVIEWS as unknown as Review[];
  }
  const mapped = (data as ReviewRow[]).map(mapReview);
  return mapped.length > 0 ? mapped : (DEFAULT_REVIEWS as unknown as Review[]);
}

export async function getLatestApprovedReviews(limit = 6): Promise<(Review & { productTitle: string; productSlug: string })[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return DEFAULT_REVIEWS;
  const { data, error } = await supabase
    .from("reviews")
    .select("id, product_id, rating, title, body, author_name, verified_purchase, status, created_at, products(title, slug)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    log.error("catalog.getLatestApprovedReviews", error);
    return DEFAULT_REVIEWS;
  }
  type Row = ReviewRow & { products: { title: string; slug: string } | null };
  const mapped = (data as unknown as Row[])
    .filter((row) => row.products)
    .map((row) => ({ ...mapReview(row), productTitle: row.products!.title, productSlug: row.products!.slug }));
  return mapped.length > 0 ? mapped : DEFAULT_REVIEWS;
}

export async function searchProducts(query: string, page = 1, pageSize = PRODUCTS_PER_PAGE): Promise<Paginated<ProductSummary>> {
  const supabase = getPublicSupabase();
  const trimmed = query.trim().toLowerCase().slice(0, 100);
  if (trimmed.length < 2) return emptyPage(page);

  if (!supabase) {
    const searchSpace = [FALLBACK_PRODUCT_SUMMARY];
    const matches = searchSpace.filter(
      (b) =>
        b.title.toLowerCase().includes(trimmed) ||
        (b.subtitle && b.subtitle.toLowerCase().includes(trimmed)) ||
        (b.author && b.author.toLowerCase().includes(trimmed)) ||
        b.exams.some((e) => e.toLowerCase().includes(trimmed)) ||
        trimmed.includes("police") ||
        trimmed.includes("si") ||
        trimmed.includes("constable") ||
        trimmed.includes("telangana") ||
        trimmed.includes("tslprb") ||
        trimmed.includes("tgpsc") ||
        trimmed.includes("general") ||
        trimmed.includes("studies"),
    );
    return { items: matches, total: matches.length, page, totalPages: Math.ceil(matches.length / pageSize) };
  }

  const { data: hits, error } = await supabase.rpc("search_product_ids", {
    p_query: trimmed,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) {
    log.error("catalog.searchProducts", error, { query: trimmed });
    const searchSpace = [FALLBACK_PRODUCT_SUMMARY];
    return { items: searchSpace, total: 1, page, totalPages: 1 };
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
    return { items: [FALLBACK_PRODUCT_SUMMARY], total: 1, page, totalPages: 1 };
  }
  const byId = new Map((data as unknown as ProductSummaryRow[]).map((row) => [row.id, mapProductSummary(row)]));
  const items = rows.map((r) => byId.get(r.product_id)).filter((p): p is ProductSummary => Boolean(p));
  const total = Number(rows[0].total_count);
  return { items, total, page, totalPages: Math.ceil(total / pageSize) };
}

export async function getAllProductSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [{ slug: FEATURED_BOOK.slug, updatedAt: new Date().toISOString() }];
  const { data, error } = await supabase.from("products").select("slug, updated_at").eq("status", "published");
  if (error) {
    log.error("catalog.getAllProductSlugs", error);
    return [{ slug: FEATURED_BOOK.slug, updatedAt: new Date().toISOString() }];
  }
  const rows = (data as { slug: string; updated_at: string }[]).map((r) => ({ slug: r.slug, updatedAt: r.updated_at }));
  return rows.length > 0 ? rows : [{ slug: FEATURED_BOOK.slug, updatedAt: new Date().toISOString() }];
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
  if (!supabase) return DEFAULT_FAQS;
  const { data, error } = await supabase.from("faqs").select("id, question, answer").order("sort_order");
  if (error) {
    log.error("catalog.getFaqs", error);
    return DEFAULT_FAQS;
  }
  const mapped = data.map(mapFaq);
  return mapped.length > 0 ? mapped : DEFAULT_FAQS;
}

export async function getLanguages(): Promise<string[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return ["Telugu & English", "Telugu", "English"];
  const { data } = await supabase.from("products").select("language").eq("status", "published").not("language", "is", null);
  const langs = [...new Set((data ?? []).map((r: { language: string }) => r.language))].sort();
  return langs.length > 0 ? langs : ["Telugu & English", "Telugu", "English"];
}
