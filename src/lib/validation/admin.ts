import { z } from "zod";
import { rupeesToPaise } from "@/lib/utils/money";

// Admin form schemas. Empty inputs become null so unknown facts stay unknown (docs/PRD.md).

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .transform((v) => (v === "" ? null : v));

const lines = (maxItems: number, maxLength = 300) =>
  z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, maxItems)
        .map((line) => line.slice(0, maxLength)),
    );

const optionalInt = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: `Enter a whole number between ${min} and ${max}` });
        return z.NEVER;
      }
      return n;
    });

const rupees = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return null;
    const paise = rupeesToPaise(v);
    if (paise === null || paise > 10_000_000_00) {
      ctx.addIssue({ code: "custom", message: "Enter a valid amount in rupees" });
      return z.NEVER;
    }
    return paise;
  });

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

export const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .max(80)
  .regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, "Use lowercase letters, numbers and hyphens only");

export const bookSchema = z
  .object({
    id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
    title: z.string().trim().min(1, "Title is required").max(200),
    slug: slugField,
    subtitle: text(300),
    author: text(200),
    authorBio: text(3000),
    description: text(20000),
    keyFeatures: lines(30),
    contents: lines(200),
    examCoverage: lines(40, 120),
    exams: lines(10, 40),
    keywords: lines(40, 60),
    sku: text(64),
    isbn: text(17).refine((v) => v === null || /^[0-9Xx-]{10,17}$/.test(v), "ISBN must be 10 or 13 digits (hyphens allowed)"),
    publisher: text(200),
    edition: text(100),
    publicationYear: optionalInt(1900, 2100),
    pages: optionalInt(1, 20000),
    language: text(60),
    dimensions: text(100),
    weightGrams: optionalInt(1, 20000),
    binding: text(60),
    mrpPaise: rupees,
    pricePaise: rupees,
    status: z.enum(["draft", "published", "archived"]),
    isFeatured: z.boolean(),
    isBestseller: z.boolean(),
    primaryCategoryId: z.uuid().nullable(),
    categoryIds: z.array(z.uuid()).max(30),
    seoTitle: text(70),
    seoDescription: text(170),
    quantity: z.coerce.number().int().min(0, "Stock cannot be negative").max(1_000_000),
    lowStockThreshold: z.coerce.number().int().min(0).max(100_000),
    allowBackorder: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.pricePaise !== null && data.mrpPaise !== null && data.pricePaise > data.mrpPaise) {
      ctx.addIssue({ code: "custom", path: ["pricePaise"], message: "Selling price cannot be higher than MRP" });
    }
    if (data.status === "published" && data.pricePaise === null && data.quantity > 0) {
      ctx.addIssue({ code: "custom", path: ["pricePaise"], message: "Set a selling price before putting stock on sale" });
    }
  });

export type BookInput = z.infer<typeof bookSchema>;

export function bookFormToObject(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "");
  return {
    id: get("id"),
    title: get("title"),
    slug: get("slug") || slugify(get("title")),
    subtitle: get("subtitle"),
    author: get("author"),
    authorBio: get("authorBio"),
    description: get("description"),
    keyFeatures: get("keyFeatures"),
    contents: get("contents"),
    examCoverage: get("examCoverage"),
    exams: get("exams"),
    keywords: get("keywords"),
    sku: get("sku"),
    isbn: get("isbn"),
    publisher: get("publisher"),
    edition: get("edition"),
    publicationYear: get("publicationYear"),
    pages: get("pages"),
    language: get("language"),
    dimensions: get("dimensions"),
    weightGrams: get("weightGrams"),
    binding: get("binding"),
    mrpPaise: get("mrp"),
    pricePaise: get("price"),
    status: get("status") || "draft",
    isFeatured: formData.get("isFeatured") === "on",
    isBestseller: formData.get("isBestseller") === "on",
    primaryCategoryId: get("primaryCategoryId") || null,
    categoryIds: formData.getAll("categoryIds").map(String),
    seoTitle: get("seoTitle"),
    seoDescription: get("seoDescription"),
    quantity: get("quantity") || "0",
    lowStockThreshold: get("lowStockThreshold") || "5",
    allowBackorder: formData.get("allowBackorder") === "on",
  };
}

export const categorySchema = z.object({
  id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  name: z.string().trim().min(1, "Name is required").max(80),
  slug: slugField,
  kind: z.enum(["exam", "subject", "type"]),
  description: text(1000),
  sortOrder: z.coerce.number().int().min(0).max(10000),
  isActive: z.boolean(),
  seoTitle: text(70),
  seoDescription: text(170),
});

export const couponSchema = z
  .object({
    id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,32}$/, "3-32 characters: letters, numbers, - or _"),
    description: text(300),
    type: z.enum(["percent", "fixed"]),
    value: z.string().trim().min(1, "Enter a value"),
    maxDiscount: rupees,
    minOrder: rupees,
    startsAt: text(30),
    expiresAt: text(30),
    maxUses: optionalInt(1, 10_000_000),
    perCustomerLimit: optionalInt(1, 1000),
    appliesTo: z.enum(["all", "products", "categories"]),
    productIds: z.array(z.uuid()).max(200),
    categoryIds: z.array(z.uuid()).max(100),
    isActive: z.boolean(),
  })
  .transform((data, ctx) => {
    const raw = Number(data.value);
    let value: number;
    if (data.type === "percent") {
      if (!Number.isInteger(raw) || raw < 1 || raw > 100) {
        ctx.addIssue({ code: "custom", path: ["value"], message: "Percent must be a whole number from 1 to 100" });
        return z.NEVER;
      }
      value = raw;
    } else {
      const paise = rupeesToPaise(data.value);
      if (!paise) {
        ctx.addIssue({ code: "custom", path: ["value"], message: "Enter the discount in rupees" });
        return z.NEVER;
      }
      value = paise;
    }
    const toIso = (v: string | null) => (v ? new Date(`${v}:00+05:30`).toISOString() : null);
    const startsAt = toIso(data.startsAt);
    const expiresAt = toIso(data.expiresAt);
    if (startsAt && expiresAt && expiresAt <= startsAt) {
      ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry must be after the start" });
      return z.NEVER;
    }
    return { ...data, value, startsAt, expiresAt };
  });
