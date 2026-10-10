import type { Category, Faq, Product, ProductSummary, Review } from "@/types";
import { FEATURED_BOOK } from "./featured-book";

export const DEFAULT_EXAMS: Category[] = [
  {
    id: "cat-upsc",
    slug: "upsc",
    name: "UPSC",
    kind: "exam",
    sortOrder: 10,
    isActive: true,
    seoTitle: "UPSC Civil Services Preparation Books",
    seoDescription: "UPSC Civil Services and competitive exam books.",
    description: "Union Public Service Commission Civil Services Examination.",
  },
  {
    id: "cat-tgpsc",
    slug: "tgpsc",
    name: "TGPSC",
    kind: "exam",
    sortOrder: 20,
    isActive: true,
    seoTitle: "TGPSC Group 1, 2, 3, 4 Preparation Books",
    seoDescription: "Telangana Public Service Commission exams books.",
    description: "Telangana Public Service Commission Group 1, 2, 3, 4 exams.",
  },
  {
    id: "cat-tslprb",
    slug: "tslprb",
    name: "TSLPRB",
    kind: "exam",
    sortOrder: 30,
    isActive: true,
    seoTitle: "TSLPRB Police SI & Constable Books",
    seoDescription: "Telangana State Level Police Recruitment Board SI & Constable exams.",
    description: "Telangana State Level Police Recruitment Board SI & Constable exams.",
  },
  {
    id: "cat-appsc",
    slug: "appsc",
    name: "APPSC",
    kind: "exam",
    sortOrder: 40,
    isActive: true,
    seoTitle: "APPSC Competitive Exam Books",
    seoDescription: "Andhra Pradesh Public Service Commission examinations.",
    description: "Andhra Pradesh Public Service Commission examinations.",
  },
  {
    id: "cat-other-state-exams",
    slug: "other-state-exams",
    name: "OTHER STATE EXAMS",
    kind: "exam",
    sortOrder: 50,
    isActive: true,
    seoTitle: "Other State Competitive Exam Books",
    seoDescription: "Other state recruitment and competitive examinations.",
    description: "Other state recruitment and competitive examinations.",
  },
];

export const DEFAULT_SUBJECTS: Category[] = [
  { id: "s-1", slug: "indian-polity", name: "Indian Polity", kind: "subject", sortOrder: 10, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-2", slug: "indian-economy", name: "Indian Economy", kind: "subject", sortOrder: 20, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-3", slug: "telangana-economy", name: "Telangana Economy", kind: "subject", sortOrder: 30, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-4", slug: "indian-history", name: "Indian History", kind: "subject", sortOrder: 40, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-5", slug: "telangana-history", name: "Telangana History", kind: "subject", sortOrder: 50, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-6", slug: "telangana-movement", name: "Telangana Movement", kind: "subject", sortOrder: 60, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-7", slug: "geography", name: "World, Indian & Telangana Geography", kind: "subject", sortOrder: 70, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-8", slug: "science-and-technology", name: "Science and Technology", kind: "subject", sortOrder: 80, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-9", slug: "environmental-science", name: "Environmental Science", kind: "subject", sortOrder: 90, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-10", slug: "sociology", name: "Sociology", kind: "subject", sortOrder: 100, isActive: true, seoTitle: null, seoDescription: null, description: null },
  { id: "s-11", slug: "current-affairs", name: "Current Affairs", kind: "subject", sortOrder: 110, isActive: true, seoTitle: null, seoDescription: null, description: null },
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
  keywords: ["police", "SI", "constable", "general studies", "UPSC", "TGPSC", "TSLPRB", "APPSC", "PYQ"],
  description:
    "Target Police covers all Telangana Sub Inspector previous question papers (Prelims and Mains) with a 360° explanation of General Studies. Written for UPSC, TGPSC, TSLPRB, APPSC and other competitive exams, and updated with 2026 data.",
  keyFeatures: FEATURED_BOOK.highlights.map((h) => `${h.title}: ${h.body}`),
  examCoverage: [...FEATURED_BOOK.subjects],
  contents: [
    "Indian Polity, Constitution & Governance",
    "Indian Economy & Telangana Socio-Economic Survey 2026",
    "Telangana Economy & State Budgets 2026-27",
    "Indian History & National Movement",
    "Telangana History, Culture & Heritage",
    "Telangana Movement & State Formation (1948-2014)",
    "World, Indian & Telangana Geography",
    "Science and Technology & Ecological Issues",
    "Environmental Science & Disaster Management",
    "Sociology & Social Issues",
    "Current Affairs, Central & State Budgets 2026-27 & Awards",
  ],
  pricePaise: 79900,
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
  seoTitle: "Target Police: General Studies Previous Papers for UPSC, TGPSC, TSLPRB, APPSC",
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
  pricePaise: 79900,
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
