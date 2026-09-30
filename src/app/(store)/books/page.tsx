import type { Metadata } from "next";
import { CatalogFilters } from "@/components/ecommerce/CatalogFilters";
import { CatalogResults } from "@/components/ecommerce/CatalogResults";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { pageHref, parseCatalogParams } from "@/lib/catalog-params";
import { getCategories, getLanguages, listProducts } from "@/services/catalog";
import type { Category, Paginated, ProductSummary } from "@/types";

export const metadata: Metadata = {
  title: "All books",
  description: "Browse exam preparation books and previous question papers for TSLPRB, TGPSC and other competitive exams.",
  alternates: { canonical: "/books" },
};

export default async function BooksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { filters, values } = parseCatalogParams(await searchParams);

  let result: Paginated<ProductSummary> = { items: [], total: 0, page: 1, totalPages: 0 };
  let failed = false;
  let exams: Category[] = [];
  let languages: string[] = [];
  try {
    [result, exams, languages] = await Promise.all([listProducts(filters), getCategories("exam"), getLanguages()]);
  } catch {
    failed = true;
  }

  return (
    <div className="container-page py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Books" }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">All books</h1>
        {result.total > 0 ? (
          <p className="text-sm text-muted">
            {result.total} {result.total === 1 ? "book" : "books"}
          </p>
        ) : null}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr] lg:gap-8">
        <aside>
          <details className="group lg:hidden" open={false}>
            <summary className="flex h-11 cursor-pointer list-none items-center justify-center rounded-[var(--radius-control)] border border-line font-semibold">
              Filter and sort
            </summary>
            <div className="mt-3">
              <CatalogFilters action="/books" values={values} exams={exams} languages={languages} />
            </div>
          </details>
          <div className="hidden lg:sticky lg:top-24 lg:block">
            <CatalogFilters action="/books" values={values} exams={exams} languages={languages} />
          </div>
        </aside>
        <CatalogResults result={result} failed={failed} hrefFor={(page) => pageHref("/books", values, page)} />
      </div>
    </div>
  );
}
