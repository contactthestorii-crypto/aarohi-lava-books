import { ArrowRight, CheckCircle, Package, Target } from "@phosphor-icons/react/ssr";
import Link from "next/link";
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

        <BookInsightPanel book={book} linkable={linkable} />
      </div>
    </section>
  );
}

function BookInsightPanel({ book, linkable }: { book: ShowcaseBook; linkable: boolean }) {
  return (
    <article
      aria-label={`${book.brand} highlights`}
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-[var(--radius-card)] bg-white text-ink shadow-[0_24px_60px_rgb(0_0_0/0.35)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 bg-red-600 px-4 py-2.5 text-white sm:px-5">
        <p className="whitespace-nowrap text-sm font-bold">For {book.exams.join(" | ")}</p>
        {book.edition ? <span className="whitespace-nowrap rounded-full bg-gold-400 px-2.5 py-0.5 text-xs font-extrabold text-ink">{book.edition}</span> : null}
      </div>
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <Target size={40} weight="duotone" className="size-8 shrink-0 text-red-600 sm:size-10" />
          <div>
            <p className="whitespace-nowrap font-display-condensed text-[2rem] font-extrabold uppercase leading-none tracking-tight text-navy-900 sm:text-4xl">{book.brand}</p>
            {book.title ? <p className="mt-1.5 font-display text-lg font-extrabold leading-tight">{book.title}</p> : null}
            {book.subtitle ? <p className="text-sm font-semibold uppercase tracking-wide text-navy-700">{book.subtitle}</p> : null}
          </div>
        </div>

        {book.highlights.length > 0 ? (
          <ul className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
            {book.highlights.slice(0, 4).map((h) => (
              <li key={h.body} className="flex gap-2.5">
                <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-success" />
                <span>
                  {h.title ? <span className="font-semibold">{h.title}: </span> : null}
                  {h.body}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          {book.author ? (
            <p className="text-sm text-muted">
              By <span className="font-semibold text-ink">{book.author}</span>
              {book.authorNote ? ` (${book.authorNote})` : ""}
            </p>
          ) : (
            <span />
          )}
          <Link href={linkable ? `/books/${book.slug}` : "#whats-inside"} className="inline-flex items-center gap-1 text-sm font-bold text-navy-700 hover:underline">
            {linkable ? "View book" : "What's inside"} <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </article>
  );
}
