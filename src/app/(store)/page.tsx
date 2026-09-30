import { ProductCard, ProductGrid } from "@/components/ecommerce/ProductCard";
import { Hero } from "@/components/home/Hero";
import {
  AuthorPublisher,
  ContactBand,
  ExamTiles,
  FaqAccordion,
  ReviewList,
  SubjectChips,
  WhyBuyDirect,
} from "@/components/home/HomeSections";
import { Section } from "@/components/home/Section";
import { Spotlight } from "@/components/home/Spotlight";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteUrl } from "@/lib/config";
import {
  getBestsellers,
  getCategories,
  getFaqs,
  getFeaturedProducts,
  getLatestApprovedReviews,
  getNewArrivals,
  getProductBySlug,
} from "@/services/catalog";
import { getSettings } from "@/services/settings";

export const revalidate = 300;

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const [settings, featured, bestsellers, newArrivals, categories, reviews, faqs] = await Promise.all([
    getSettings(),
    safe(getFeaturedProducts(8), []),
    safe(getBestsellers(8), []),
    safe(getNewArrivals(8), []),
    safe(getCategories(), []),
    safe(getLatestApprovedReviews(6), []),
    safe(getFaqs(), []),
  ]);

  const spotlightSummary = featured[0] ?? newArrivals[0] ?? null;
  const spotlight = spotlightSummary ? await safe(getProductBySlug(spotlightSummary.slug), null) : null;

  const shown = new Set(featured.map((p) => p.id));
  const bestsellerRow = bestsellers.filter((p) => !(featured.length === 1 && shown.has(p.id)));
  bestsellerRow.forEach((p) => shown.add(p.id));
  const freshArrivals = newArrivals.filter((p) => !shown.has(p.id));

  const exams = categories.filter((c) => c.kind === "exam");
  const subjects = categories.filter((c) => c.kind !== "exam");

  return (
    <>
      <Hero title={settings.home.hero_title} subtitle={settings.home.hero_subtitle} spotlight={spotlightSummary} />

      {featured.length === 1 && spotlight ? (
        <Section title="Featured book" id="featured">
          <Spotlight product={spotlight} />
        </Section>
      ) : featured.length > 1 ? (
        <Section title="Featured books" href="/books" id="featured">
          <ProductGrid products={featured} priorityCount={2} />
        </Section>
      ) : null}

      {exams.length > 0 ? (
        <Section title="Browse by exam" id="exams" className="pt-0 md:pt-0">
          <ExamTiles exams={exams} />
        </Section>
      ) : null}

      {bestsellerRow.length > 0 ? (
        <Section title="Best sellers" href="/books?sort=featured" id="bestsellers">
          <ul className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
            {bestsellerRow.map((product) => (
              <li key={product.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]">
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {freshArrivals.length > 0 ? (
        <Section title="New arrivals" href="/books?sort=newest" id="new">
          <ProductGrid products={freshArrivals.slice(0, 4)} />
        </Section>
      ) : null}

      <div className="container-page py-12 md:py-16">
        <WhyBuyDirect />
      </div>

      {subjects.length > 0 ? (
        <Section title="Browse by subject" id="subjects" className="pt-0 md:pt-0">
          <SubjectChips subjects={subjects} />
        </Section>
      ) : null}

      {spotlight?.author ? (
        <Section title="Author and publisher" id="author">
          <AuthorPublisher product={spotlight} storeName={settings.store.name} />
        </Section>
      ) : null}

      {reviews.length > 0 ? (
        <Section title="What readers say" id="reviews">
          <ReviewList reviews={reviews} />
        </Section>
      ) : null}

      {faqs.length > 0 ? (
        <Section title="Frequently asked questions" href="/faq" hrefLabel="All FAQs" id="faq">
          <FaqAccordion faqs={faqs.slice(0, 5)} />
        </Section>
      ) : null}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: settings.store.name,
              url: siteUrl,
              logo: `${siteUrl}/brand/aarohi-lava-logo.png`,
              ...(settings.store.support_email || settings.store.support_phone
                ? { contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: settings.store.support_email || undefined, telephone: settings.store.support_phone || undefined } }
                : {}),
            },
            {
              "@type": "WebSite",
              name: settings.store.name,
              url: siteUrl,
              potentialAction: { "@type": "SearchAction", target: `${siteUrl}/search?q={query}`, "query-input": "required name=query" },
            },
          ],
        }}
      />

      <div className="container-page pb-4">
        <ContactBand phone={settings.store.support_phone} email={settings.store.support_email} />
      </div>
    </>
  );
}
