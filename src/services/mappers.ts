import type {
  Address,
  Banner,
  Category,
  CategoryKind,
  Faq,
  Product,
  ProductImage,
  ProductStatus,
  ProductSummary,
  Review,
  ReviewStatus,
  StockInfo,
} from "@/types";

// Row shapes returned by the PostgREST selects in the services. Keep in sync with the
// select strings below and with supabase/migrations.

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  kind: CategoryKind;
  sort_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
}

export interface ImageRow {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  sort_order: number;
}

export interface InventoryRow {
  quantity: number;
  reserved: number;
  low_stock_threshold: number;
  allow_backorder: boolean;
}

export interface ProductSummaryRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  author: string | null;
  exams: string[];
  mrp_paise: number | null;
  price_paise: number | null;
  rating_avg: number | string;
  rating_count: number;
  is_featured: boolean;
  is_bestseller: boolean;
  published_at: string | null;
  product_images: ImageRow[] | null;
  inventory: InventoryRow | InventoryRow[] | null;
}

export interface ProductRow extends ProductSummaryRow {
  status: ProductStatus;
  description: string | null;
  author_bio: string | null;
  key_features: string[];
  contents: string[];
  exam_coverage: string[];
  keywords: string[];
  sku: string | null;
  isbn: string | null;
  publisher: string | null;
  edition: string | null;
  publication_year: number | null;
  pages: number | null;
  language: string | null;
  dimensions: string | null;
  weight_grams: number | null;
  binding: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
  primary_category_id: string | null;
  product_categories: { categories: CategoryRow | null }[] | null;
}

export const CATEGORY_COLUMNS = "id, slug, name, description, kind, sort_order, is_active, seo_title, seo_description";
const IMAGE_COLUMNS = "id, url, alt, width, height, sort_order";
const INVENTORY_COLUMNS = "quantity, reserved, low_stock_threshold, allow_backorder";

export const PRODUCT_SUMMARY_SELECT = `id, slug, title, subtitle, author, exams, mrp_paise, price_paise, rating_avg, rating_count, is_featured, is_bestseller, published_at, product_images(${IMAGE_COLUMNS}), inventory(${INVENTORY_COLUMNS})`;

export const PRODUCT_DETAIL_SELECT = `${PRODUCT_SUMMARY_SELECT}, status, description, author_bio, key_features, contents, exam_coverage, keywords, sku, isbn, publisher, edition, publication_year, pages, language, dimensions, weight_grams, binding, seo_title, seo_description, updated_at, primary_category_id, product_categories(categories(${CATEGORY_COLUMNS}))`;

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    kind: row.kind,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}

function mapImage(row: ImageRow): ProductImage {
  return { id: row.id, url: row.url, alt: row.alt, width: row.width, height: row.height, sortOrder: row.sort_order };
}

export function computeStock(inventory: InventoryRow | null): StockInfo {
  if (!inventory) return { available: 0, state: "out_of_stock" };
  const available = Math.max(inventory.quantity - inventory.reserved, 0);
  if (available <= 0) return { available: 0, state: inventory.allow_backorder ? "backorder" : "out_of_stock" };
  if (available <= inventory.low_stock_threshold) return { available, state: "low_stock" };
  return { available, state: "in_stock" };
}

function single<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function sortedImages(rows: ImageRow[] | null): ProductImage[] {
  return (rows ?? []).map(mapImage).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function mapProductSummary(row: ProductSummaryRow): ProductSummary {
  const images = sortedImages(row.product_images);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    author: row.author,
    exams: row.exams ?? [],
    mrpPaise: row.mrp_paise,
    pricePaise: row.price_paise,
    ratingAvg: Number(row.rating_avg) || 0,
    ratingCount: row.rating_count,
    isFeatured: row.is_featured,
    isBestseller: row.is_bestseller,
    publishedAt: row.published_at,
    cover: images[0] ?? null,
    stock: computeStock(single(row.inventory)),
  };
}

export function mapProduct(row: ProductRow): Product {
  const categories = (row.product_categories ?? [])
    .map((link) => link.categories)
    .filter((c): c is CategoryRow => Boolean(c))
    .map(mapCategory)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    ...mapProductSummary(row),
    status: row.status,
    description: row.description,
    authorBio: row.author_bio,
    keyFeatures: row.key_features ?? [],
    contents: row.contents ?? [],
    examCoverage: row.exam_coverage ?? [],
    keywords: row.keywords ?? [],
    sku: row.sku,
    isbn: row.isbn,
    publisher: row.publisher,
    edition: row.edition,
    publicationYear: row.publication_year,
    pages: row.pages,
    language: row.language,
    dimensions: row.dimensions,
    weightGrams: row.weight_grams,
    binding: row.binding,
    images: sortedImages(row.product_images),
    categories,
    primaryCategory: categories.find((c) => c.id === row.primary_category_id) ?? categories[0] ?? null,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    updatedAt: row.updated_at,
  };
}

export interface ReviewRow {
  id: string;
  product_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  author_name: string;
  verified_purchase: boolean;
  status: ReviewStatus;
  created_at: string;
}

export function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    productId: row.product_id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    authorName: row.author_name,
    verifiedPurchase: row.verified_purchase,
    status: row.status,
    createdAt: row.created_at,
  };
}

export interface AddressRow {
  id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  area: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  is_default: boolean;
}

export function mapAddress(row: AddressRow): Address {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2,
    area: row.area,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    landmark: row.landmark,
    isDefault: row.is_default,
  };
}

export interface BannerRow {
  id: string;
  placement: Banner["placement"];
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
}

export function mapBanner(row: BannerRow): Banner {
  return {
    id: row.id,
    placement: row.placement,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    linkLabel: row.link_label,
  };
}

export function mapFaq(row: { id: string; question: string; answer: string }): Faq {
  return { id: row.id, question: row.question, answer: row.answer };
}
