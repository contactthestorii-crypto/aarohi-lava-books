import {
  ArrowUpRight,
  BookOpenText,
  ChatCircleText,
  CreditCard,
  MapPinLine,
  Package,
  SealCheck,
  Star,
} from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import type { Category, Faq, Product, Review } from "@/types";

/** Large navy tiles, one per exam category. */
export function ExamTiles({ exams }: { exams: Category[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {exams.map((exam, index) => (
        <li key={exam.id} className={index === 0 && exams.length % 2 === 1 ? "col-span-2 md:col-span-1" : undefined}>
          <Link
            href={`/categories/${exam.slug}`}
            className="group flex h-full min-h-32 flex-col justify-between rounded-[var(--radius-card)] bg-navy-900 p-5 text-white transition-colors hover:bg-navy-800"
          >
            <span className="font-display-condensed text-2xl font-extrabold uppercase leading-none md:text-3xl">{exam.name}</span>
            <span className="mt-4 flex items-end justify-between gap-2 text-sm text-navy-200">
              <span className="line-clamp-2">{exam.description ?? "Books and previous papers"}</span>
              <ArrowUpRight size={20} weight="bold" className="shrink-0 text-gold-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </Link>
        </li>
      ))}
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

/** Horizontal-scroll pills for subject categories. */
export function SubjectChips({ subjects }: { subjects: Category[] }) {
  return (
    <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
      {subjects.map((subject) => (
        <li key={subject.id} className="shrink-0">
          <Link
            href={`/categories/${subject.slug}`}
            className="inline-flex h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-semibold text-navy-900 transition-colors hover:border-navy-700 hover:bg-navy-50"
          >
            {subject.name}
          </Link>
        </li>
      ))}
    </ul>
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
