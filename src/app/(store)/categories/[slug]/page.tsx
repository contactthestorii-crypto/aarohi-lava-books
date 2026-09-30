import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogFilters } from "@/components/ecommerce/CatalogFilters";
import { CatalogResults } from "@/components/ecommerce/CatalogResults";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { pageHref, parseCatalogParams } from "@/lib/catalog-params";
import { isSupabaseConfigured } from "@/lib/config";
import { getCategories, getCategoryBySlug, getLanguages, listProducts } from "@/services/catalog";
import type { Paginated, ProductSummary } from "@/types";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category) return { title: "Category" };
  return {
    title: category.seoTitle ?? `${category.name} books`,
    description:
      category.seoDescription ?? category.description ?? `Books and previous question papers for ${category.name} from Aarohi Lava Publications.`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { filters, values } = parseCatalogParams(await searchParams);

  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category && isSupabaseConfigured) notFound();

  let result: Paginated<ProductSummary> = { items: [], total: 0, page: 1, totalPages: 0 };
  let failed = false;
  let languages: string[] = [];
  let exams = await getCategories("exam").catch(() => []);
  try {
    [result, languages] = await Promise.all([listProducts({ ...filters, categorySlug: slug }), getLanguages()]);
  } catch {
    failed = true;
  }
  if (category?.kind === "exam") exams = [];

  const base = `/categories/${slug}`;
  const name = category?.name ?? "Category";

  return (
    <div className="container-page py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Books", href: "/books" }, { label: name }]} />
      <div className="mt-4">
        <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">{name}</h1>
        {category?.description ? <p className="mt-2 max-w-[65ch] text-[15px] text-muted">{category.description}</p> : null}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr] lg:gap-8">
        <aside>
          <details className="lg:hidden">
            <summary className="flex h-11 cursor-pointer list-none items-center justify-center rounded-[var(--radius-control)] border border-line font-semibold">
              Filter and sort
            </summary>
            <div className="mt-3">
              <CatalogFilters action={base} values={values} exams={exams} languages={languages} hideExam={exams.length === 0} />
            </div>
          </details>
          <div className="hidden lg:sticky lg:top-24 lg:block">
            <CatalogFilters action={base} values={values} exams={exams} languages={languages} hideExam={exams.length === 0} />
          </div>
        </aside>
        <CatalogResults
          result={result}
          failed={failed}
          hrefFor={(page) => pageHref(base, values, page)}
          emptyTitle={`No ${name} books yet`}
          emptyDescription="New titles are added regularly. Browse all books in the meantime."
        />
      </div>
    </div>
  );
}
