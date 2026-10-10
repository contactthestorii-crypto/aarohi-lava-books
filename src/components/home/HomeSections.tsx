import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BookOpenText,
  Briefcase,
  ChatCircleText,
  CreditCard,
  FileText,
  Folders,
  GraduationCap,
  MapPinLine,
  Package,
  SealCheck,
  ShieldCheck,
  Star,
} from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import type { Category, Faq, Product, Review } from "@/types";

const EXAM_META: Record<
  string,
  {
    badge: string;
    tag: string;
    icon: React.ComponentType<{ size?: number; className?: string; weight?: "bold" | "fill" | "duotone" }>;
  }
> = {
  upsc: { badge: "Civil Services", tag: "GS Paper I & II Focus", icon: GraduationCap },
  tgpsc: { badge: "Group 1, 2, 3, 4", tag: "State Services Solved Papers", icon: FileText },
  tslprb: { badge: "Police Recruitment", tag: "SI & Constable 2012–2024 PYQs", icon: ShieldCheck },
  appsc: { badge: "Andhra Pradesh PSC", tag: "Executive & Non-Executive Exams", icon: Briefcase },
  "other-state-exams": { badge: "State & Central", tag: "Recruitment Boards Question Bank", icon: Folders },
};

/** Authoritative cards for each competitive exam category. */
export function ExamTiles({ exams }: { exams: Category[] }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {exams.map((exam) => {
        const meta = EXAM_META[exam.slug] ?? {
          badge: "Competitive Exam",
          tag: "Solved Papers & Guides",
          icon: FileText,
        };
        const Icon = meta.icon;

        return (
          <li key={exam.id}>
            <Link
              href={`/categories/${exam.slug}`}
              className="group flex h-full min-h-[180px] flex-col justify-between rounded-2xl border border-line/90 bg-gradient-to-b from-navy-900 to-navy-950 p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/60 hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={18} weight="bold" className="text-gold-400" />
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-gold-300">
                      {meta.badge}
                    </span>
                  </div>
                  <ArrowUpRight
                    size={18}
                    weight="bold"
                    className="text-slate-400 transition-transform group-hover:text-gold-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </div>

                <h3 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-white group-hover:text-gold-300 transition-colors">
                  {exam.name}
                </h3>

                <p className="mt-1 text-xs text-navy-200 font-medium">
                  {meta.tag}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                <span>View Books & Papers</span>
                <span className="font-bold text-gold-400">→</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const REASONS = [
  {
    icon: BookOpenText,
    title: "Direct from the publisher",
    body: "You buy from Aarohi Lava Publications itself, so you get the current edition.",
  },
  {
    icon: CreditCard,
    title: "Secure payments",
    body: "Pay with UPI, cards, net banking or wallets through Razorpay. We never see your card details.",
  },
  {
    icon: Package,
    title: "Track every order",
    body: "Follow your parcel with the order ID and courier tracking number from your confirmation.",
  },
  {
    icon: MapPinLine,
    title: "Delivery to your pincode",
    body: "Check delivery for your pincode on any book page before you order.",
  },
];

/** Asymmetric two-column block: statement left, reasons right. */
export function WhyBuyDirect() {
  return (
    <div className="grid gap-8 rounded-[var(--radius-card)] bg-navy-50 p-6 md:p-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">Why buy direct</h2>
        <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
          Ordering from the publisher&apos;s own store keeps things simple: the right book, a clear price and a parcel you
          can track.
        </p>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2">
        {REASONS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-white text-navy-700 ring-1 ring-line">
              <Icon size={22} />
            </span>
            <div>
              <p className="font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Structured Academic Curriculum Grid for the 11 General Studies subjects. */
export function SubjectChips({ subjects }: { subjects: Category[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {subjects.map((subject, idx) => (
        <Link
          key={subject.id}
          href={`/categories/${subject.slug}`}
          className="group flex flex-col justify-between rounded-xl border border-line bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-700 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-400">
              <BookOpen size={13} weight="bold" className="text-navy-700" />
              <span className="text-[11px] font-bold">
                Module {String(idx + 1).padStart(2, "0")}
              </span>
            </div>
            <ArrowRight
              size={14}
              weight="bold"
              className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-navy-900"
            />
          </div>

          <p className="mt-2 text-sm font-bold text-navy-950 group-hover:text-navy-700 transition-colors leading-snug">
            {subject.name}
          </p>

          <span className="mt-2 text-[11px] text-muted font-medium">
            360° Syllabus Notes &amp; PYQs
          </span>
        </Link>
      ))}
    </div>
  );
}

/** Author and publisher, taken from the featured book's data. */
export function AuthorPublisher({ product, storeName }: { product: Product; storeName: string }) {
  return (
    <div className="grid overflow-hidden rounded-[var(--radius-card)] border border-line md:grid-cols-2">
      <div className="p-6 md:p-10">
        <p className="text-sm font-semibold text-muted">The author</p>
        <p className="mt-1 font-display text-2xl font-extrabold text-ink">{product.author}</p>
        {product.authorBio ? <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted">{product.authorBio}</p> : null}
        <Link href={`/books/${product.slug}`} className="mt-4 inline-block text-sm font-semibold text-navy-700 hover:underline">
          Books by {product.author}
        </Link>
      </div>
      <div className="flex flex-col justify-center gap-4 bg-navy-900 p-6 text-white sm:flex-row sm:items-center md:p-10">
        <Image src="/brand/aarohi-lava-logo.png" alt="" width={104} height={79} className="h-16 w-auto rounded-md bg-white p-1" />
        <div>
          <p className="text-sm font-semibold text-navy-200">The publisher</p>
          <p className="mt-1 font-display text-2xl font-extrabold">{product.publisher ?? storeName}</p>
          <Link href="/about" className="mt-2 inline-block text-sm font-semibold text-gold-400 hover:underline">
            About us
          </Link>
        </div>
      </div>
    </div>
  );
}

type ReviewWithBook = Review & { productTitle: string; productSlug: string };

export function ReviewList({ reviews }: { reviews: ReviewWithBook[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {reviews.slice(0, 3).map((review) => (
        <li key={review.id} className="flex flex-col rounded-[var(--radius-card)] border border-line p-5">
          <div className="flex" aria-label={`${review.rating} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} size={16} weight="fill" className={i < review.rating ? "text-gold-400" : "text-navy-100"} />
            ))}
          </div>
          {review.title ? <p className="mt-3 font-semibold text-ink">{review.title}</p> : null}
          {review.body ? <p className="mt-1 line-clamp-3 text-[15px] leading-relaxed text-muted">{review.body}</p> : null}
          <p className="mt-auto pt-4 text-sm">
            <span className="font-semibold text-ink">{review.authorName}</span>
            {review.verifiedPurchase ? (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-success">
                <SealCheck size={14} weight="fill" /> Verified purchase
              </span>
            ) : null}
            <Link href={`/books/${review.productSlug}`} className="mt-0.5 block text-xs text-muted hover:text-navy-700">
              on {review.productTitle}
            </Link>
          </p>
        </li>
      ))}
    </ul>
  );
}

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-line rounded-[var(--radius-card)] border border-line">
      {faqs.map((faq) => (
        <details key={faq.id} className="group px-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-ink">
            {faq.question}
            <span aria-hidden="true" className="text-xl font-normal text-navy-700 transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="max-w-[70ch] pb-5 text-[15px] leading-relaxed text-muted">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function ContactBand({ phone, email }: { phone: string; email: string }) {
  return (
    <div className="flex flex-col gap-5 rounded-[var(--radius-card)] border-2 border-navy-900 p-6 md:flex-row md:items-center md:justify-between md:p-8">
      <div className="flex gap-4">
        <ChatCircleText size={36} className="shrink-0 text-red-600" />
        <div>
          <p className="font-display text-xl font-extrabold text-ink">Questions about a book or an order?</p>
          <p className="mt-1 text-[15px] text-muted">
            {phone || email ? (
              <>
                Reach us at {phone ? <a href={`tel:${phone}`} className="font-semibold text-navy-700">{phone}</a> : null}
                {phone && email ? " or " : null}
                {email ? <a href={`mailto:${email}`} className="font-semibold text-navy-700">{email}</a> : null}.
              </>
            ) : (
              "Send us a message and we will reply by email."
            )}
          </p>
        </div>
      </div>
      <ButtonLink href="/contact" variant="dark" size="lg" className="shrink-0">
        Contact us
      </ButtonLink>
    </div>
  );
}
