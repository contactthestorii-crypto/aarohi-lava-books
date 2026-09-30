import {
  BookOpen,
  ChartBar,
  ChartPieSlice,
  Clock,
  FileText,
  LinkSimple,
  MagnifyingGlass,
  Star,
  Trophy,
  UsersThree,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import type { ShowcaseBook } from "@/lib/content/showcase";

// Icons follow the order of the highlights printed on the cover.
const ICONS: Icon[] = [FileText, BookOpen, ChartBar, ChartPieSlice, Trophy, LinkSimple, Clock, MagnifyingGlass, Star, UsersThree];

/** Everything the book covers, as readable content instead of a picture of the cover. */
export function WhatsInside({ book, linkable }: { book: ShowcaseBook; linkable: boolean }) {
  return (
    <section id="whats-inside" aria-labelledby="whats-inside-heading" className="container-page scroll-mt-24 py-12 md:py-16">
      <div className="max-w-2xl">
        <h2 id="whats-inside-heading" className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
          What&apos;s inside {book.brand}
        </h2>
        {book.title || book.subtitle ? (
          <p className="mt-2 text-[15px] text-muted">
            {[book.title, book.subtitle].filter(Boolean).join(": ")}
            {book.edition ? `, ${book.edition.charAt(0).toLowerCase()}${book.edition.slice(1)}` : ""}.
          </p>
        ) : null}
      </div>

      {book.highlights.length > 0 ? (
        <ul className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {book.highlights.map((highlight, index) => {
            const HighlightIcon = ICONS[index % ICONS.length];
            return (
              <li key={highlight.body} className="flex gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-navy-50 text-navy-700 ring-1 ring-line">
                  <HighlightIcon size={22} aria-hidden="true" />
                </span>
                <div>
                  {highlight.title ? <p className="font-semibold text-ink">{highlight.title}</p> : null}
                  <p className={highlight.title ? "text-sm leading-relaxed text-muted" : "text-[15px] leading-relaxed text-ink"}>{highlight.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {book.subjects.length > 0 ? (
        <div className="mt-10 rounded-[var(--radius-card)] bg-navy-900 p-6 text-white md:p-8">
          <p className="font-display text-lg font-extrabold">Subjects covered</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {book.subjects.map((subject) => (
              <li key={subject} className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold ring-1 ring-white/15">
                {subject}
              </li>
            ))}
          </ul>
          {linkable ? (
            <Link href={`/books/${book.slug}`} className="mt-6 inline-block text-sm font-bold text-gold-400 hover:underline">
              See price and book details
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
