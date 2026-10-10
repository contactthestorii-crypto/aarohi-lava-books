import { AspirantSuccessSection } from "@/components/home/AspirantSuccessSection";
import { DualBookShowcase } from "@/components/home/DualBookShowcase";
import { EcommerceUspStrip } from "@/components/home/EcommerceUspStrip";
import { Hero } from "@/components/home/Hero";
import {
  AuthorPublisher,
  ContactBand,
  ExamTiles,
  FaqAccordion,
  SubjectChips,
  WhyBuyDirect,
} from "@/components/home/HomeSections";
import { InsideBookPreviewSection } from "@/components/home/InsideBookPreviewSection";
import { Section } from "@/components/home/Section";
import { StudyMethodologySection } from "@/components/home/StudyMethodologySection";
import { WhatsInside } from "@/components/home/WhatsInside";
import {
  DEFAULT_EXAMS,
  DEFAULT_FAQS,
  DEFAULT_SUBJECTS,
  FALLBACK_PRODUCT,
} from "@/lib/content/default-catalog";
import { FALLBACK_SHOWCASE, showcaseFromProduct } from "@/lib/content/showcase";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteUrl } from "@/lib/config";
import {
  getCategories,
  getFaqs,
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
  const [settings, categories, faqs, englishProd, teluguProd] = await Promise.all([
    getSettings(),
    safe(getCategories(), []),
    safe(getFaqs(), []),
    safe(getProductBySlug("target-police-general-studies-tslprb-tgpsc"), null),
    safe(getProductBySlug("target-police-general-studies-telugu"), null),
  ]);

  const effectiveEnglish = englishProd ?? FALLBACK_PRODUCT;
  const effectiveTelugu = teluguProd ?? {
    ...FALLBACK_PRODUCT,
    id: "6ab7cfff-165f-41d5-aa4e-eb457045db5b",
    slug: "target-police-general-studies-telugu",
    title: "Target Police: 360° Explanation of General Studies (Telugu Medium)",
    subtitle: "Previous Question Papers",
    language: "Telugu",
    cover: {
      id: "img-telugu",
      url: "/images/books/target-police-telugu.jpg",
      alt: "Target Police Telugu Cover",
      width: 800,
      height: 1200,
      sortOrder: 0,
    },
  };

  const fromDb = effectiveEnglish ? showcaseFromProduct(effectiveEnglish) : null;
  const showcase = fromDb && fromDb.highlights.length > 0 ? fromDb : FALLBACK_SHOWCASE;

  const exams = categories.filter((c) => c.kind === "exam");
  const subjects = categories.filter((c) => c.kind !== "exam");

  const effectiveExams = exams.length > 0 ? exams : DEFAULT_EXAMS;
  const effectiveSubjects = subjects.length > 0 ? subjects : DEFAULT_SUBJECTS;
  const effectiveFaqs = faqs.length > 0 ? faqs : DEFAULT_FAQS;

  return (
    <>
      <Hero
        title={settings.home.hero_title}
        subtitle={settings.home.hero_subtitle}
        book={showcase}
        linkable={true}
      />

      <EcommerceUspStrip />

      <Section
        title="Official Publications & Direct Purchase"
        description="Select your edition below. Both editions include 10 years of solved question papers, 2026 state and central budgets, and socio-economic survey analysis."
        id="publications"
      >
        <DualBookShowcase
          englishProduct={effectiveEnglish}
          teluguProduct={effectiveTelugu}
        />
      </Section>

      <Section
        title="Browse by Exam Category"
        description="Official preparation materials and previous solved question papers for UPSC, TGPSC, TSLPRB, APPSC and other competitive exams."
        id="exams"
      >
        <ExamTiles exams={effectiveExams} />
      </Section>

      <InsideBookPreviewSection slug={showcase.slug} />

      <WhatsInside book={showcase} linkable={true} />

      <StudyMethodologySection />

      <AspirantSuccessSection />

      <div className="container-page pb-12 md:pb-16">
        <WhyBuyDirect />
      </div>

      <Section
        title="Explore by Subject & Module"
        description="Quickly find targeted topics and modules for your syllabus preparation."
        id="subjects"
        className="pt-0 md:pt-0"
      >
        <SubjectChips subjects={effectiveSubjects} />
      </Section>

      <Section title="Author & Publisher Credentials" id="author">
        <AuthorPublisher product={effectiveEnglish} storeName={settings.store.name} />
      </Section>

      <Section
        title="Frequently Asked Questions"
        description="Everything you need to know about ordering, delivery timelines, and syllabus updates."
        href="/faq"
        hrefLabel="All FAQs"
        id="faq"
      >
        <FaqAccordion faqs={effectiveFaqs.slice(0, 5)} />
      </Section>

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
                ? {
                    contactPoint: {
                      "@type": "ContactPoint",
                      contactType: "customer support",
                      email: settings.store.support_email || undefined,
                      telephone: settings.store.support_phone || undefined,
                    },
                  }
                : {}),
            },
            {
              "@type": "WebSite",
              name: settings.store.name,
              url: siteUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/search?q={query}`,
                "query-input": "required name=query",
              },
            },
          ],
        }}
      />

      <div className="container-page pb-6">
        <ContactBand phone={settings.store.support_phone} email={settings.store.support_email} />
      </div>
    </>
  );
}

