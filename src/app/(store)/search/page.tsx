import { MagnifyingGlass } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { CatalogResults } from "@/components/ecommerce/CatalogResults";
import { Button } from "@/components/ui/Button";
import { getCategories, searchProducts } from "@/services/catalog";
import type { Paginated, ProductSummary } from "@/types";

export const metadata: Metadata = {
  title: "Search books",
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const q = (raw ?? "").trim().slice(0, 100);
  const page = Math.min(Math.max(Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1, 1), 100);

  let result: Paginated<ProductSummary> = { items: [], total: 0, page, totalPages: 0 };
  let failed = false;
  if (q.length >= 2) {
    try {
      result = await searchProducts(q, page);
    } catch {
      failed = true;
    }
  }
  const exams = await getCategories("exam").catch(() => []);

  return (
    <div className="container-page py-6 md:py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
        {q ? <>Results for &ldquo;{q}&rdquo;</> : "Search books"}
      </h1>
      <form action="/search" method="get" role="search" className="mt-5 flex max-w-2xl gap-2">
        <label htmlFor="q" className="sr-only">
          Search books
        </label>
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Title, author, ISBN, exam or subject"
            className="h-12 w-full rounded-[var(--radius-control)] border border-line pl-10 pr-3 text-base focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-700/20"
          />
        </div>
        <Button type="submit" size="lg" variant="dark">
          Search
        </Button>
      </form>

      {exams.length > 0 ? (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          Popular:
          {exams.map((exam) => (
            <Link key={exam.id} href={`/categories/${exam.slug}`} className="rounded-full bg-navy-50 px-3 py-1 font-semibold text-navy-900 hover:bg-navy-100">
              {exam.name}
            </Link>
          ))}
        </p>
      ) : null}

      <div className="mt-8">
        {q.length < 2 ? (
          <p className="text-[15px] text-muted">Type at least two characters to search.</p>
        ) : (
          <>
            {result.total > 0 ? (
              <p className="mb-4 text-sm text-muted">
                {result.total} {result.total === 1 ? "book" : "books"} found
              </p>
            ) : null}
            <CatalogResults
              result={result}
              failed={failed}
              hrefFor={(p) => `/search?q=${encodeURIComponent(q)}${p > 1 ? `&page=${p}` : ""}`}
              emptyTitle={`No books match "${q}"`}
              emptyDescription="Check the spelling, search by exam (TSLPRB, TGPSC) or subject, or browse all books."
            />
          </>
        )}
      </div>
    </div>
  );
}
