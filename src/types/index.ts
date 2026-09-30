// Domain types used across services and UI. Database rows are mapped into these in
// src/services/*, so components never depend on column names.

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "RETURN_REQUESTED",
  "RETURNED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type PaymentMethod = "online" | "cod";
export type PaymentStatus =
  | "created"
  | "captured"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "cod_pending"
  | "cod_collected";
export type ProductStatus = "draft" | "published" | "archived";
export type CategoryKind = "exam" | "subject" | "type";
export type ReviewStatus = "pending" | "approved" | "hidden";
export type UserRole = "customer" | "admin";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  kind: CategoryKind;
  sortOrder: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
}

export type StockState = "in_stock" | "low_stock" | "out_of_stock" | "backorder";

export interface StockInfo {
  available: number;
  state: StockState;
}

export interface ProductSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  author: string | null;
  exams: string[];
  mrpPaise: number | null;
  pricePaise: number | null;
  ratingAvg: number;
  ratingCount: number;
  isFeatured: boolean;
  isBestseller: boolean;
  publishedAt: string | null;
  cover: ProductImage | null;
  stock: StockInfo;
}

export interface Product extends ProductSummary {
  status: ProductStatus;
  description: string | null;
  authorBio: string | null;
  keyFeatures: string[];
  contents: string[];
  examCoverage: string[];
  keywords: string[];
  sku: string | null;
  isbn: string | null;
  publisher: string | null;
  edition: string | null;
  publicationYear: number | null;
  pages: number | null;
  language: string | null;
  dimensions: string | null;
  weightGrams: number | null;
  binding: string | null;
  images: ProductImage[];
  categories: Category[];
  primaryCategory: Category | null;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  rating: number;
  title: string | null;
  body: string | null;
  authorName: string;
  verifiedPurchase: boolean;
  status: ReviewStatus;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  area: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  isDefault: boolean;
}

/** Address snapshot stored on an order (jsonb). */
export type ShippingAddress = Omit<Address, "id" | "isDefault">;

export interface Banner {
  id: string;
  placement: "announcement" | "hero" | "promo";
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}
