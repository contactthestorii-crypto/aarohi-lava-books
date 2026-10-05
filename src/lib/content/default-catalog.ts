import type { Category, Faq, Product, ProductSummary, Review } from "@/types";
import { FEATURED_BOOK } from "./featured-book";

export const DEFAULT_EXAMS: Category[] = [
  {
    id: "cat-tslprb",
    slug: "tslprb",
    name: "TSLPRB Police",
    kind: "exam",
    sortOrder: 10,
    isActive: true,
    seoTitle: null,
    seoDescription: null,
    description: "Telangana State Level Police Recruitment Board SI & Constable exams.",
  },
  {
    id: "cat-tgpsc",
    slug: "tgpsc",
    name: "TGPSC Civil Services",
    kind: "exam",
    sortOrder: 20,
    isActive: true,
    seoTitle: null,
    seoDescription: null,
    description: "Telangana Public Service Commission Group 1, 2, 3, 4 exams.",
  },
  {
    id: "cat-police-exams",
    slug: "police-exams",
    name: "Previous Solved Papers",
    kind: "exam",
    sortOrder: 30,
    isActive: true,
    seoTitle: null,
    seoDescription: null,
    description: "Topic-wise 10-year question banks and analytical answer keys.",
  },
  {
    id: "cat-competitive-exams",
    slug: "competitive-exams",
    name: "General Studies & GS",
    kind: "exam",
    sortOrder: 40,
    isActive: true,
    seoTitle: null,
    seoDescription: null,
    description: "State history, movement, economy, polity, and 2026 surveys.",
  },
];

export const DEFAULT_SUBJECTS: Category[] = [
  { id: "s-1", slug: "telangana-history", name: "Telangana History", kind: "subject", sortOrder: 10, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-2", slug: "telangana-movement", name: "Telangana Movement", kind: "subject", sortOrder: 20, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-3", slug: "indian-polity", name: "Indian Polity", kind: "subject", sortOrder: 30, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-4", slug: "economy", name: "Telangana Economy", kind: "subject", sortOrder: 40, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-5", slug: "geography", name: "Geography", kind: "subject", sortOrder: 50, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-6", slug: "current-affairs", name: "Current Affairs 2026", kind: "subject", sortOrder: 60, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-7", slug: "science-technology", name: "Science & Technology", kind: "subject", sortOrder: 70, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-8", slug: "telangana-culture", name: "Telangana Culture & Arts", kind: "subject", sortOrder: 80, isActive: true, seoTitle: null, seoDescription: null, description: null },
];

export const FALLBACK_PRODUCT: Product = {
  id: "target-police-fallback",
  slug: FEATURED_BOOK.slug,
  title: `${FEATURED_BOOK.brand}: ${FEATURED_BOOK.title}`,
  subtitle: FEATURED_BOOK.subtitle,
  author: FEATURED_BOOK.author,
  authorBio: `${FEATURED_BOOK.author} (${FEATURED_BOOK.authorQualification}) is the author of Target Police and veteran mentor for competitive examinations.`,
  publisher: FEATURED_BOOK.publisher,
  edition: FEATURED_BOOK.edition,
  publicationYear: 2026,
  isbn: "978-93-5912-001-9",
  sku: "TP-360-GS-2026",
  pages: 560,
  language: "Telugu & English",
  binding: "Paperback",
  dimensions: "24 x 18 x 3 cm",
  weightGrams: 680,
  exams: [...FEATURED_BOOK.exams],
  keywords: ["police", "SI", "constable", "general studies", "TSLPRB", "TGPSC", "PYQ"],
  description:
    "Target Police covers all Telangana Sub Inspector previous question papers (Prelims and Mains) with a 360° explanation of General Studies. Written for TSLPRB, TGPSC and other competitive exams, and updated with 2026 data.",
  keyFeatures: FEATURED_BOOK.highlights.map((h) => `${h.title}: ${h.body}`),
  examCoverage: [...FEATURED_BOOK.subjects],
  contents: [
    "Telangana History, Culture & Heritage",
    "Telangana Movement & State Formation (1948-2014)",
    "Indian Polity, Constitution & Governance",
    "Indian Economy & Telangana Socio-Economic Survey 2026",
    "Geography of India & Telangana District Demographics",
    "Science & Technology and Ecology",
    "Current Affairs, State Budgets 2026-27 & Padma/Nobel Awards",
    "TSLPRB SI Prelims & Mains Solved Papers (2012-2024)",
  ],
  pricePaise: 80900,
  mrpPaise: 89900,
  stock: { available: 500, state: "in_stock" },
  status: "published",
  isFeatured: true,
  isBestseller: true,
  ratingAvg: 5.0,
  ratingCount: 48,
  categories: [DEFAULT_EXAMS[0]],
  primaryCategory: DEFAULT_EXAMS[0],
  images: [
    {
      id: "img-1",
      url: "/images/books/target-police-3d-english.jpg",
      alt: "Target Police 360 General Studies 3D Book Mockup",
      width: 800,
      height: 1200,
      sortOrder: 0,
    },
    {
      id: "img-2",
      url: "/images/books/target-police-english.jpg",
      alt: "Target Police English Cover Details",
      width: 800,
      height: 1200,
      sortOrder: 1,
    },
  ],
  cover: {
    id: "img-1",
    url: "/images/books/target-police-3d-english.jpg",
    alt: "Target Police 360 General Studies 3D Book Mockup",
    width: 800,
    height: 1200,
    sortOrder: 0,
  },
  seoTitle: "Target Police: General Studies Previous Papers for TSLPRB, TGPSC",
  seoDescription:
    "All Telangana SI previous question papers (Prelims & Mains) with 360° explanations of General Studies. Updated with 2026 data.",
  publishedAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

export const FALLBACK_PRODUCT_SUMMARY: ProductSummary = {
  id: FALLBACK_PRODUCT.id,
  slug: FALLBACK_PRODUCT.slug,
  title: FALLBACK_PRODUCT.title,
  subtitle: FALLBACK_PRODUCT.subtitle,
  author: FALLBACK_PRODUCT.author,
  exams: FALLBACK_PRODUCT.exams,
  pricePaise: 80900,
  mrpPaise: 89900,
  stock: FALLBACK_PRODUCT.stock,
  ratingAvg: 5.0,
  ratingCount: 48,
  isFeatured: true,
  isBestseller: true,
  publishedAt: "2026-01-01T00:00:00Z",
  cover: {
    id: "img-1",
    url: "/images/books/target-police-3d-english.jpg",
    alt: "Target Police 360 General Studies 3D Book Mockup",
    width: 800,
    height: 1200,
    sortOrder: 0,
  },
};

export type ReviewWithBook = Review & { productTitle: string; productSlug: string };

export const DEFAULT_REVIEWS: ReviewWithBook[] = [];

export const DEFAULT_FAQS: Faq[] = [
  {
    id: "faq-1",
    question: "Is this book updated with the latest 2026 Telangana syllabus?",
    answer:
      "Yes. The 2026 edition includes the latest Telangana Socio-Economic Survey 2026, Central & State Budgets 2026-27, Nobel/Padma/Gaddar awards, and updated PYQ trends.",
  },
  {
    id: "faq-2",
    question: "How do I track my order once placed?",
    answer:
      "Once dispatched from our Hyderabad warehouse, you will receive an SMS and email with your courier AWB tracking number. You can also click 'Track Order' in the header anytime.",
  },
  {
    id: "faq-3",
    question: "What payment methods are supported?",
    answer:
      "We accept all major payment methods securely via Razorpay: UPI (GPay, PhonePe, Paytm, BHIM), Debit & Credit Cards, Net Banking, and Wallets.",
  },
  {
    id: "faq-4",
    question: "How many days does delivery take?",
    answer:
      "Orders are dispatched within 24 to 48 hours. Delivery typically takes 2–4 business days across Telangana and Andhra Pradesh.",
  },
];
