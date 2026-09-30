import { CaretLeft, CaretRight } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type PaginationProps = {
  page: number;
  totalPages: number;
  /** Builds the href for a page number, preserving other query params. */
  hrefFor: (page: number) => string;
};

export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  const item = "inline-flex h-10 min-w-10 items-center justify-center rounded-[var(--radius-control)] px-3 text-sm font-semibold";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(item, "border border-line hover:bg-navy-50")} aria-label="Previous page">
          <CaretLeft size={16} />
        </Link>
      ) : null}
      {pages.map((p, index) => (
        <span key={p} className="flex items-center gap-1.5">
          {index > 0 && p - pages[index - 1] > 1 ? <span className="px-1 text-muted">…</span> : null}
          <Link
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(item, p === page ? "bg-navy-900 text-white" : "border border-line hover:bg-navy-50")}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={cn(item, "border border-line hover:bg-navy-50")} aria-label="Next page">
          <CaretRight size={16} />
        </Link>
      ) : null}
    </nav>
  );
}
