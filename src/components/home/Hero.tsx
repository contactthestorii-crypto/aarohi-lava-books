import { ArrowRight, Package } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import type { ProductSummary } from "@/types";

/** Split hero: message and CTAs left, the real book cover right (docs/DESIGN.md). */
export function Hero({ title, subtitle, spotlight }: { title: string; subtitle: string; spotlight: ProductSummary | null }) {
  const cover = spotlight?.cover ?? { url: "/books/target-police-cover.jpg", alt: "Target Police book cover", width: 763, height: 1119 };
  const coverAlt = cover.alt || `${spotlight?.title ?? "Book"} cover`;
  return (
    <section className="relative overflow-hidden bg-navy-900 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_40%,rgb(31_59_122/0.9),transparent_70%)]"
      />
      <div className="container-page relative grid items-center gap-10 py-12 md:grid-cols-[1.1fr_0.9fr] md:py-16 lg:py-20">
        <div className="max-w-xl">
          <h1 className="font-display-condensed text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-navy-100">{subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/books" size="lg" icon={<ArrowRight size={18} weight="bold" />} className="flex-row-reverse">
              Explore books
            </ButtonLink>
            <ButtonLink
              href="/track-order"
              size="lg"
              variant="inverse"
              icon={<Package size={18} weight="bold" />}
            >
              Track order
            </ButtonLink>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[20rem] md:max-w-[22rem]">
          <div aria-hidden="true" className="absolute -inset-x-3 bottom-0 top-10 md:-inset-x-6 rounded-[var(--radius-card)] bg-white/5 ring-1 ring-white/10" />
          {spotlight ? (
            <Link href={`/books/${spotlight.slug}`} className="relative block transition-transform duration-200 hover:-translate-y-1">
              <Image
                src={cover.url}
                alt={coverAlt}
                width={cover.width ?? 763}
                height={cover.height ?? 1119}
                priority
                sizes="(min-width: 768px) 352px, 320px"
                className="h-auto w-full rounded-md shadow-[0_24px_60px_rgb(0_0_0/0.45)]"
              />
            </Link>
          ) : (
            <Image
              src={cover.url}
              alt={coverAlt}
              width={cover.width ?? 763}
              height={cover.height ?? 1119}
              priority
              sizes="(min-width: 768px) 352px, 320px"
              className="relative h-auto w-full rounded-md shadow-[0_24px_60px_rgb(0_0_0/0.45)]"
            />
          )}
        </div>
      </div>
    </section>
  );
}
