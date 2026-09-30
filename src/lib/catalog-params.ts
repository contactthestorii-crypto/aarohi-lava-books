import { SORT_OPTIONS, type ProductFilters, type SortOption } from "@/services/catalog";
import type { FilterValues } from "@/components/ecommerce/CatalogFilters";

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() ? v.trim().slice(0, 100) : undefined;
}

function rupees(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
}

/** Parses and sanitises listing query params (never trusted as-is). */
export function parseCatalogParams(params: RawParams): { filters: ProductFilters; values: FilterValues } {
  const sortRaw = first(params.sort);
  const sort = sortRaw && sortRaw in SORT_OPTIONS ? (sortRaw as SortOption) : undefined;
  const page = Math.min(Math.max(Number(first(params.page)) || 1, 1), 500);
  const values: FilterValues = {
    exam: first(params.exam),
    language: first(params.language),
    sort,
    inStock: first(params.inStock) === "1",
    min: first(params.min),
    max: first(params.max),
  };
  return {
    values,
    filters: {
      exam: values.exam,
      language: values.language,
      sort,
      page,
      inStockOnly: values.inStock,
      minPricePaise: rupees(values.min),
      maxPricePaise: rupees(values.max),
    },
  };
}

/** Builds a listing URL keeping current filters and changing the page. */
export function pageHref(base: string, values: FilterValues, page: number): string {
  const search = new URLSearchParams();
  if (values.sort) search.set("sort", values.sort);
  if (values.exam) search.set("exam", values.exam);
  if (values.language) search.set("language", values.language);
  if (values.inStock) search.set("inStock", "1");
  if (values.min) search.set("min", values.min);
  if (values.max) search.set("max", values.max);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}
