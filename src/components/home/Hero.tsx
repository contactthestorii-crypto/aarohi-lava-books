import { ArrowRight, Package } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import type { ShowcaseBook } from "@/lib/content/showcase";

/**
 * Split hero: message and CTAs left; right, the featured book presented from its data
 * (exams, edition, highlights, author) rather than a photo of the cover.
 */
export function Hero({ title, subtitle, book, linkable }: { title: string; subtitle: string; book: ShowcaseBook; linkable: boolean }) {
  return (
    <section className="relative overflow-hidden bg-navy-900 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_40%,rgb(31_59_122/0.9),transparent_70%)]"
      />
      <div className="container-page relative grid items-center gap-10 py-12 md:grid-cols-[1fr_1fr] md:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div className="max-w-xl">
          <h1 className="font-display-condensed text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-navy-100">{subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/books" size="lg" icon={<ArrowRight size={18} weight="bold" />} className="flex-row-reverse">
              Explore books
            </ButtonLink>
            <ButtonLink href="/track-order" size="lg" variant="inverse" icon={<Package size={18} weight="bold" />}>
              Track order
            </ButtonLink>
          </div>
        </div>

        <div className="relative w-full aspect-[16/9] lg:aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.4)]">
          <Image
            src="/images/ecommerce/new-hero-banner.jpg"
            alt="Target Police Book Highlights"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
