import type { Product } from "@/types";
import { FEATURED_BOOK } from "./featured-book";

/** Data needed to present a book without its cover photo. */
export interface ShowcaseBook {
  slug: string;
  brand: string;
  title: string | null;
  subtitle: string | null;
  exams: string[];
  edition: string | null;
  author: string | null;
  authorNote: string | null;
  highlights: { title: string | null; body: string }[];
  subjects: string[];
}

export function showcaseFromProduct(product: Product): ShowcaseBook {
  const [brand, ...rest] = product.title.split(":");
  const title = rest.join(":").trim() || null;
  return {
    slug: product.slug,
    brand: brand.trim(),
    title,
    subtitle: product.subtitle,
    exams: product.exams,
    edition: product.edition,
    author: product.author,
    authorNote: null,
    highlights: product.keyFeatures.map((body) => ({ title: null, body })),
    subjects: product.examCoverage,
  };
}

export const FALLBACK_SHOWCASE: ShowcaseBook = {
  slug: FEATURED_BOOK.slug,
  brand: FEATURED_BOOK.brand,
  title: FEATURED_BOOK.title,
  subtitle: FEATURED_BOOK.subtitle,
  exams: [...FEATURED_BOOK.exams],
  edition: FEATURED_BOOK.edition,
  author: FEATURED_BOOK.author,
  authorNote: FEATURED_BOOK.authorQualification,
  highlights: FEATURED_BOOK.highlights.map((h) => ({ title: h.title, body: h.body })),
  subjects: [...FEATURED_BOOK.subjects],
};
