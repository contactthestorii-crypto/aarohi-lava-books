import {
  BookOpen,
  ChartBar,
  ChartPieSlice,
  CheckCircle,
  Clock,
  FileText,
  Lightning,
  LinkSimple,
  MagnifyingGlass,
  Sparkle,
  Star,
  Trophy,
  UsersThree,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import type { ShowcaseBook } from "@/lib/content/showcase";

const ICONS: Icon[] = [FileText, BookOpen, ChartBar, ChartPieSlice, Trophy, LinkSimple, Clock, MagnifyingGlass, Star, UsersThree];

/** Everything the book covers, presented as a syllabus blueprint. */
export function WhatsInside({ book, linkable }: { book: ShowcaseBook; linkable: boolean }) {
  return (
    <section id="whats-inside" aria-labelledby="whats-inside-heading" className="container-page scroll-mt-24 py-12 md:py-16">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1 text-xs font-bold text-navy-800 ring-1 ring-inset ring-navy-200/60">
            <Sparkle size={14} className="text-gold-400" />
            <span>Syllabus & Content Blueprint</span>
          </div>
          <h2 id="whats-inside-heading" className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl lg:text-4xl">
            What&apos;s Inside {book.brand}
          </h2>
          {book.title || book.subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
              {[book.title, book.subtitle].filter(Boolean).join(": ")}
              {book.edition ? ` (${book.edition.toLowerCase()})` : ""}.
            </p>
          ) : null}
        </div>

        {linkable ? (
          <ButtonLink
            href={`/books/${book.slug}`}
            size="md"
            icon={<Lightning size={16} weight="fill" />}
            className="shrink-0 bg-red-600 hover:bg-red-700"
          >
            Order This Edition
          </ButtonLink>
        ) : null}
      </div>

      {book.highlights.length > 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {book.highlights.map((highlight, index) => {
            const HighlightIcon = ICONS[index % ICONS.length];
            return (
              <li
                key={highlight.body}
                className="group flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-navy-200 hover:shadow-md"
              >
                <div className="flex items-start gap-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-800 ring-1 ring-line transition-colors group-hover:bg-navy-900 group-hover:text-gold-400">
                    <HighlightIcon size={22} weight="duotone" aria-hidden="true" />
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted">Feature #{index + 1}</span>
                    {highlight.title ? (
                      <p className="font-display text-base font-bold text-ink group-hover:text-navy-700">{highlight.title}</p>
                    ) : null}
                    <p className="mt-1 text-xs leading-relaxed text-muted">{highlight.body}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {book.subjects.length > 0 ? (
        <div className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-gold-400">100% Exam Scope</span>
              <p className="mt-1 font-display text-xl font-extrabold text-white md:text-2xl">
                Subjects & Modules Covered
              </p>
              <p className="mt-1 text-xs text-navy-200">
                Detailed theory, previous question papers, and probable questions structured topic-by-topic.
              </p>
            </div>
            {linkable ? (
              <Link
                href={`/books/${book.slug}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gold-400 px-5 py-2 text-xs font-extrabold text-navy-950 transition-all hover:bg-gold-300"
              >
                View Full Table of Contents &rarr;
              </Link>
            ) : null}
          </div>

          <ul className="mt-6 flex flex-wrap gap-2">
            {book.subjects.map((subject) => (
              <li
                key={subject}
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-navy-100 ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <CheckCircle size={14} weight="fill" className="text-gold-400" />
                <span>{subject}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

