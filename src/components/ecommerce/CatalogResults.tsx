import { Books, WarningCircle } from "@phosphor-icons/react/ssr";
import { ButtonLink } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { isSupabaseConfigured } from "@/lib/config";
import type { Paginated, ProductSummary } from "@/types";
import { ProductGrid } from "./ProductCard";

/** Grid + pagination with the empty/error/not-configured states shared by listing pages. */
export function CatalogResults({
  result,
  failed,
  hrefFor,
  emptyTitle = "No books found",
  emptyDescription = "Try removing a filter or browse all books.",
}: {
  result: Paginated<ProductSummary>;
  failed: boolean;
  hrefFor: (page: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!isSupabaseConfigured) {
    return (
      <EmptyState
        icon={<Books />}
        title="The catalog is being set up"
        description="Books will appear here as soon as the store is connected to its database."
      />
    );
  }
  if (failed) {
    return (
      <ErrorState
        icon={<WarningCircle />}
        title="We could not load books right now"
        description="Please refresh the page in a moment."
      />
    );
  }
  if (result.items.length === 0) {
    return (
      <EmptyState
        icon={<Books />}
        title={emptyTitle}
        description={emptyDescription}
        action={
          <ButtonLink href="/books" variant="secondary">
            Browse all books
          </ButtonLink>
        }
      />
    );
  }
  return (
    <div className="space-y-8">
      <ProductGrid products={result.items} priorityCount={4} className="lg:grid-cols-3 xl:grid-cols-3" />
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={hrefFor} />
    </div>
  );
}
