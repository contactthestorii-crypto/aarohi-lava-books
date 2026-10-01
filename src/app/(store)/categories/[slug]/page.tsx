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

function getCategoryBannerImage(slug: string): string {
  if (slug.includes("tslprb")) return "/images/ecommerce/cat-tslprb.jpg";
  if (slug.includes("tgpsc")) return "/images/ecommerce/cat-tgpsc.jpg";
  if (slug.includes("police") || slug.includes("paper")) return "/images/ecommerce/cat-papers.jpg";
  return "/images/ecommerce/cat-general-studies.jpg";
}

import { DEFAULT_EXAMS, DEFAULT_SUBJECTS, FALLBACK_PRODUCT_SUMMARY } from "@/lib/content/default-catalog";

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { filters, values } = parseCatalogParams(await searchParams);

  const category = await getCategoryBySlug(slug).catch(() => null);
  const fallbackCat = DEFAULT_EXAMS.find((e) => e.slug === slug) ?? DEFAULT_SUBJECTS.find((s) => s.slug === slug);
  const effectiveCategory = category ?? fallbackCat;

  if (!effectiveCategory && isSupabaseConfigured) notFound();

  let result: Paginated<ProductSummary> = { items: [], total: 0, page: 1, totalPages: 0 };
  let failed = false;
  let languages: string[] = [];
  let exams = await getCategories("exam").catch(() => []);
  try {
    [result, languages] = await Promise.all([listProducts({ ...filters, categorySlug: slug }), getLanguages()]);
  } catch {
    failed = true;
  }
  if (effectiveCategory?.kind === "exam") exams = [];

  const effectiveResult: Paginated<ProductSummary> =
    result.items.length > 0
      ? result
      : {
          items: [FALLBACK_PRODUCT_SUMMARY],
          total: 1,
          page: 1,
          totalPages: 1,
        };

  const base = `/categories/${slug}`;
  const name = effectiveCategory?.name ?? "Category";
  const bannerImage = getCategoryBannerImage(slug);

  return (
    <div className="container-page py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Books", href: "/books" }, { label: name }]} />

      {/* Category Header Hero Card */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-navy-800 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 p-6 text-white shadow-lg md:p-8">
        <div className="flex flex-col-reverse items-center justify-between gap-6 md:flex-row">
          <div className="max-w-2xl text-center md:text-left">
            <span className="rounded-full bg-gold-400/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-gold-400 ring-1 ring-gold-400/30">
              Official Exam Collection
            </span>
            <h1 className="mt-3 font-display-condensed text-3xl font-extrabold uppercase tracking-tight text-white md:text-4xl lg:text-5xl">
              {name}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-navy-200 md:text-base">
              {category?.description ??
                "Comprehensive study guides, topic-wise PYQs, and 360° explanations curated for competitive examination aspirants."}
            </p>
          </div>
          <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-white/10 p-2 ring-1 ring-white/20 sm:size-28 md:size-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerImage}
              alt=""
              className="size-full object-contain drop-shadow-md"
            />
          </div>
        </div>
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
          result={effectiveResult}
          failed={failed}
          hrefFor={(page) => pageHref(base, values, page)}
          emptyTitle={`No ${name} books yet`}
          emptyDescription="New titles are added regularly. Browse all books in the meantime."
        />
      </div>
    </div>
  );
}
