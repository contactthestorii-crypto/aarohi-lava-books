import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content/ContentPage";
import { FaqAccordion } from "@/components/home/HomeSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { getFaqs } from "@/services/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers about ordering, payments, delivery and tracking at Aarohi Lava Publications.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqs = await getFaqs().catch(() => []);
  return (
    <ContentPage title="Frequently asked questions">
      {faqs.length > 0 ? (
        <>
          <div className="max-w-3xl">
            <FaqAccordion faqs={faqs} />
          </div>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
            }}
          />
        </>
      ) : (
        <p className="text-[15px] text-muted">Answers will appear here soon.</p>
      )}
      <p className="mt-8 text-[15px] text-muted">
        Still have a question?{" "}
        <Link href="/contact" className="font-semibold text-navy-700 hover:underline">
          Contact us
        </Link>
      </p>
    </ContentPage>
  );
}
