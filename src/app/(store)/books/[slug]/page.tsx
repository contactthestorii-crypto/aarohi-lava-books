import { CheckCircle, SealCheck, ShieldCheck, Star } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookGallery } from "@/components/ecommerce/BookGallery";
import { PincodeChecker } from "@/components/ecommerce/PincodeChecker";
import { PriceDisplay } from "@/components/ecommerce/PriceDisplay";
import { ProductBuyBox } from "@/components/ecommerce/ProductBuyBox";
import { ProductGrid } from "@/components/ecommerce/ProductCard";
import { ReviewForm } from "@/components/ecommerce/ReviewForm";
import { StockStatus, isPurchasable } from "@/components/ecommerce/StockStatus";
import { WishlistButton } from "@/components/ecommerce/WishlistButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Rating } from "@/components/ui/Rating";
import { siteUrl } from "@/lib/config";
import { discountPercent } from "@/lib/utils/money";
import { getAllProductSlugs, getApprovedReviews, getProductBySlug, getRelatedProducts } from "@/services/catalog";
import { getFrequentlyBoughtTogether } from "@/services/recommendations";
import type { Product, Review } from "@/types";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

async function load(slug: string) {
  try {
    return await getProductBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await load(slug);
  if (!product) return { title: "Book not found", robots: { index: false } };
  const title = product.seoTitle ?? product.title;
  const description =
    product.seoDescription ?? product.description?.slice(0, 160) ?? `${product.title} by ${product.author ?? "Aarohi Lava Publications"}.`;
  const image = product.cover
    ? [{ url: product.cover.url, width: product.cover.width ?? undefined, height: product.cover.height ?? undefined, alt: `${product.title} cover` }]
    : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/books/${product.slug}` },
    openGraph: { type: "website", title, description, url: `/books/${product.slug}`, images: image },
    twitter: { card: "summary_large_image", title, description, images: image?.map((i) => i.url) },
  };
}

function productJsonLd(product: Product, reviews: Review[]) {
  const url = `${siteUrl}/books/${product.slug}`;
  const images = product.images.map((image) => (image.url.startsWith("http") ? image.url : `${siteUrl}${image.url}`));
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["Product", "Book"],
    name: product.title,
    url,
    image: images,
    description: product.description ?? undefined,
    author: product.author ? { "@type": "Person", name: product.author } : undefined,
    publisher: product.publisher ? { "@type": "Organization", name: product.publisher } : undefined,
    isbn: product.isbn ?? undefined,
    sku: product.sku ?? product.isbn ?? undefined,
    numberOfPages: product.pages ?? undefined,
    inLanguage: product.language ?? undefined,
    bookEdition: product.edition ?? undefined,
    brand: { "@type": "Brand", name: product.publisher ?? "Aarohi Lava Publications" },
  };
  if (product.pricePaise !== null) {
    data.offers = {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: (product.pricePaise / 100).toFixed(2),
      availability:
        product.stock.state === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : product.stock.state === "backorder"
            ? "https://schema.org/BackOrder"
            : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    };
  }
  if (product.ratingCount > 0) {
    data.aggregateRating = { "@type": "AggregateRating", ratingValue: product.ratingAvg, reviewCount: product.ratingCount };
    data.review = reviews.slice(0, 5).map((review) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5 },
      author: { "@type": "Person", name: review.authorName },
      datePublished: review.createdAt.slice(0, 10),
      reviewBody: review.body ?? undefined,
    }));
  }
  return data;
}

const NOT_AVAILABLE = "Not yet available";

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await load(slug);
  if (!product) notFound();

  const [reviews, related, boughtTogether] = await Promise.all([
    getApprovedReviews(product.id),
    getRelatedProducts(product, 4),
    getFrequentlyBoughtTogether(product.id, 3),
  ]);

  const purchasable = isPurchasable(product.pricePaise, product.stock);
  const off = discountPercent(product.mrpPaise, product.pricePaise);
  const category = product.primaryCategory;

  const specs: { label: string; value: string | null }[] = [
    { label: "Author", value: product.author },
    { label: "Publisher", value: product.publisher },
    { label: "Edition", value: product.edition },
    { label: "Publication year", value: product.publicationYear?.toString() ?? null },
    { label: "ISBN", value: product.isbn },
    { label: "Pages", value: product.pages?.toString() ?? null },
    { label: "Language", value: product.language },
    { label: "Binding", value: product.binding },
    { label: "Dimensions", value: product.dimensions },
    { label: "Weight", value: product.weightGrams ? `${product.weightGrams} g` : null },
    { label: "Exams", value: product.exams.length ? product.exams.join(", ") : null },
  ];

  return (
    <div className="container-page pb-28 pt-6 md:pb-12 md:pt-8">
      <Breadcrumbs
        items={[
          { label: "Books", href: "/books" },
          ...(category ? [{ label: category.name, href: `/categories/${category.slug}` }] : []),
          { label: product.title },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,30rem)_1fr] lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <BookGallery images={product.images} title={product.title} />
        </div>

        <div>
          <div className="flex flex-wrap gap-1.5">
            {product.exams.map((exam) => (
              <span key={exam} className="rounded-full bg-navy-900 px-2.5 py-0.5 text-xs font-bold text-white">
                {exam}
              </span>
            ))}
            {product.edition ? (
              <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-bold text-ink ring-1 ring-inset ring-gold-400">
                {product.edition}
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">{product.title}</h1>
          {product.subtitle ? <p className="mt-1 text-lg font-semibold text-navy-700">{product.subtitle}</p> : null}
          {product.author ? (
            <p className="mt-2 text-[15px] text-muted">
              by <span className="font-semibold text-ink">{product.author}</span>
            </p>
          ) : null}
          <div className="mt-2">
            {product.ratingCount > 0 ? (
              <a href="#reviews">
                <Rating value={product.ratingAvg} count={product.ratingCount} />
              </a>
            ) : (
              <p className="text-sm text-muted">No reviews yet</p>
            )}
          </div>

          <div className="mt-6 border-t border-line pt-6">
            <PriceDisplay pricePaise={product.pricePaise} mrpPaise={product.mrpPaise} size="lg" />
            {off !== null ? <p className="mt-1 text-sm text-muted">You save {off}% on MRP.</p> : null}
            <StockStatus stock={product.stock} pricePaise={product.pricePaise} className="mt-2" />
            <div className="mt-5">
              <ProductBuyBox
                productId={product.id}
                pricePaise={product.pricePaise}
                stock={product.stock}
                purchasable={purchasable}
                disabledLabel={product.pricePaise === null ? "Coming soon" : "Out of stock"}
              />
            </div>
            <div className="mt-2">
              <WishlistButton productId={product.id} />
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <ShieldCheck size={18} className="text-success" />
              Secure checkout with UPI, cards, net banking and wallets
            </p>
          </div>

          <div className="mt-6">
            <PincodeChecker />
          </div>

          {product.keyFeatures.length > 0 ? (
            <div className="mt-8">
              <h2 className="font-display text-xl font-extrabold">Key features</h2>
              <ul className="mt-3 grid gap-2.5">
                {product.keyFeatures.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-[15px]">
                    <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-success" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-12">
        <div className="space-y-10">
          {product.description ? (
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="font-display text-2xl font-extrabold">
                About the book
              </h2>
              <p className="mt-3 max-w-[70ch] whitespace-pre-line text-[15px] leading-relaxed text-ink/90">{product.description}</p>
            </section>
          ) : null}

          {product.examCoverage.length > 0 ? (
            <section aria-labelledby="coverage-heading">
              <h2 id="coverage-heading" className="font-display text-2xl font-extrabold">
                Exam coverage
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.examCoverage.map((subject) => (
                  <li key={subject} className="rounded-full bg-navy-50 px-3 py-1.5 text-sm font-semibold text-navy-900 ring-1 ring-inset ring-line">
                    {subject}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {product.contents.length > 0 ? (
            <section aria-labelledby="contents-heading">
              <h2 id="contents-heading" className="font-display text-2xl font-extrabold">
                Contents
              </h2>
              <ol className="mt-3 grid gap-x-8 gap-y-2 text-[15px] sm:grid-cols-2">
                {product.contents.map((chapter, index) => (
                  <li key={`${chapter}-${index}`} className="flex gap-3">
                    <span className="w-6 shrink-0 text-right font-semibold tabular-nums text-muted">{index + 1}.</span>
                    <span>{chapter}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {product.author ? (
            <section aria-labelledby="author-heading" className="rounded-[var(--radius-card)] bg-navy-50 p-6">
              <h2 id="author-heading" className="font-display text-2xl font-extrabold">
                About the author
              </h2>
              <p className="mt-2 font-semibold">{product.author}</p>
              {product.authorBio ? <p className="mt-1 max-w-[70ch] text-[15px] leading-relaxed text-muted">{product.authorBio}</p> : null}
            </section>
          ) : null}

          <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24">
            <h2 id="reviews-heading" className="font-display text-2xl font-extrabold">
              Reviews
            </h2>
            {reviews.length > 0 ? (
              <>
                <Rating value={product.ratingAvg} count={product.ratingCount} className="mt-2" />
                <ul className="mt-5 divide-y divide-line">
                  {reviews.map((review) => (
                    <li key={review.id} className="py-5">
                      <div className="flex items-center gap-2">
                        <span className="flex" aria-label={`${review.rating} out of 5 stars`}>
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} size={16} weight="fill" className={i < review.rating ? "text-gold-400" : "text-navy-100"} />
                          ))}
                        </span>
                        {review.title ? <span className="font-semibold">{review.title}</span> : null}
                      </div>
                      {review.body ? <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed">{review.body}</p> : null}
                      <p className="mt-2 text-sm text-muted">
                        {review.authorName} ·{" "}
                        {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {review.verifiedPurchase ? (
                          <span className="ml-2 inline-flex items-center gap-1 font-semibold text-success">
                            <SealCheck size={14} weight="fill" /> Verified purchase
                          </span>
                        ) : null}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-[15px] text-muted">No reviews yet. Bought this book? Share what you think.</p>
            )}
            <details className="mt-5 rounded-[var(--radius-card)] border border-line p-5">
              <summary className="cursor-pointer font-semibold text-navy-700">Write a review</summary>
              <p className="mt-2 text-sm text-muted">
                You need to be{" "}
                <Link href={`/auth/login?next=/books/${product.slug}%23reviews`} className="font-semibold text-navy-700 underline">
                  signed in
                </Link>{" "}
                to post a review.
              </p>
              <div className="mt-4">
                <ReviewForm productId={product.id} slug={product.slug} />
              </div>
            </details>
          </section>
        </div>

        <aside aria-labelledby="specs-heading" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[var(--radius-card)] border border-line p-5">
            <h2 id="specs-heading" className="font-display text-xl font-extrabold">
              Specifications
            </h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
              {specs.map((spec) => (
                <div key={spec.label} className="contents">
                  <dt className="text-muted">{spec.label}</dt>
                  <dd className={spec.value ? "font-semibold text-ink" : "text-muted/80"}>{spec.value ?? NOT_AVAILABLE}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>

      {boughtTogether.length > 0 ? (
        <section aria-labelledby="together-heading" className="mt-14">
          <h2 id="together-heading" className="font-display text-2xl font-extrabold">
            Frequently bought together
          </h2>
          <ProductGrid products={boughtTogether} className="mt-5" />
        </section>
      ) : null}

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="mt-14">
          <h2 id="related-heading" className="font-display text-2xl font-extrabold">
            Related books
          </h2>
          <ProductGrid products={related} className="mt-5" />
        </section>
      ) : null}

      <JsonLd data={productJsonLd(product, reviews)} />
    </div>
  );
}
