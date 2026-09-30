"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { failure, invalid, type ActionResult } from "@/lib/action-result";
import { createServerSupabase } from "@/lib/supabase/server";
import { CATALOG_TAG } from "@/lib/supabase/public";
import { rupeesToPaise } from "@/lib/utils/money";
import { categorySchema, couponSchema, slugify } from "@/lib/validation/admin";
import { settingsSchemas, type SettingsKey } from "@/services/settings";
import { withAdmin } from "./guard";

// Admin writes for catalog structure and site content, all through the admin session
// (RLS admin policies). Public pages are refreshed via the catalog cache tag.

const id = z.uuid();

function refreshStore(...paths: string[]) {
  updateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
  for (const path of paths) revalidatePath(path);
}

// ---------------------------------------------------------------- categories
export async function saveCategoryAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return withAdmin("categories.save", async () => {
    const raw = Object.fromEntries(formData);
    const parsed = categorySchema.safeParse({
      ...raw,
      slug: String(raw.slug || "") || slugify(String(raw.name || "")),
      isActive: formData.get("isActive") === "on",
    });
    if (!parsed.success) return invalid(parsed.error);
    const c = parsed.data;
    const row = {
      name: c.name,
      slug: c.slug,
      kind: c.kind,
      description: c.description,
      sort_order: c.sortOrder,
      is_active: c.isActive,
      seo_title: c.seoTitle,
      seo_description: c.seoDescription,
    };
    const supabase = await createServerSupabase();
    const { error } = c.id ? await supabase.from("categories").update(row).eq("id", c.id) : await supabase.from("categories").insert(row);
    if (error?.code === "23505") return { ok: false, error: "Please check the highlighted fields.", fieldErrors: { slug: "This slug is already used" } };
    if (error) throw error;
    refreshStore("/admin/categories", `/categories/${c.slug}`);
    return { ok: true, message: "Category saved." };
  });
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  return withAdmin("categories.delete", async () => {
    if (!id.safeParse(categoryId).success) return failure("Invalid category.");
    const supabase = await createServerSupabase();
    const { count } = await supabase.from("product_categories").select("product_id", { count: "exact", head: true }).eq("category_id", categoryId);
    if ((count ?? 0) > 0) return failure(`This category has ${count} book(s). Hide it instead, or remove the books from it first.`);
    const { error } = await supabase.from("categories").delete().eq("id", categoryId);
    if (error) throw error;
    refreshStore("/admin/categories");
    return { ok: true, message: "Category deleted." };
  });
}

// ---------------------------------------------------------------- coupons
export async function saveCouponAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return withAdmin("coupons.save", async () => {
    const raw = Object.fromEntries(formData);
    const parsed = couponSchema.safeParse({
      ...raw,
      maxDiscount: String(raw.maxDiscount ?? ""),
      minOrder: String(raw.minOrder ?? ""),
      startsAt: String(raw.startsAt ?? ""),
      expiresAt: String(raw.expiresAt ?? ""),
      maxUses: String(raw.maxUses ?? ""),
      perCustomerLimit: String(raw.perCustomerLimit ?? ""),
      productIds: formData.getAll("productIds").map(String),
      categoryIds: formData.getAll("categoryIds").map(String),
      isActive: formData.get("isActive") === "on",
    });
    if (!parsed.success) return invalid(parsed.error);
    const c = parsed.data;
    if (c.appliesTo === "products" && c.productIds.length === 0) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: { productIds: "Pick at least one book" } };
    if (c.appliesTo === "categories" && c.categoryIds.length === 0) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: { categoryIds: "Pick at least one category" } };
    const row = {
      code: c.code,
      description: c.description,
      type: c.type,
      value: c.value,
      max_discount_paise: c.type === "percent" ? c.maxDiscount : null,
      min_order_paise: c.minOrder ?? 0,
      starts_at: c.startsAt,
      expires_at: c.expiresAt,
      max_uses: c.maxUses,
      per_customer_limit: c.perCustomerLimit,
      applies_to: c.appliesTo,
      product_ids: c.appliesTo === "products" ? c.productIds : [],
      category_ids: c.appliesTo === "categories" ? c.categoryIds : [],
      is_active: c.isActive,
    };
    const supabase = await createServerSupabase();
    const { error } = c.id ? await supabase.from("coupons").update(row).eq("id", c.id) : await supabase.from("coupons").insert(row);
    if (error?.code === "23505") return { ok: false, error: "Please check the highlighted fields.", fieldErrors: { code: "This code already exists" } };
    if (error) throw error;
    revalidatePath("/admin/coupons");
    return { ok: true, message: `Coupon ${c.code} saved.` };
  });
}

export async function toggleCouponAction(couponId: string, active: boolean): Promise<ActionResult> {
  return withAdmin("coupons.toggle", async () => {
    if (!id.safeParse(couponId).success) return failure("Invalid coupon.");
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("coupons").update({ is_active: active }).eq("id", couponId);
    if (error) throw error;
    revalidatePath("/admin/coupons");
    return { ok: true, message: active ? "Coupon activated." : "Coupon deactivated." };
  });
}

// ---------------------------------------------------------------- reviews
export async function moderateReviewAction(reviewId: string, status: "approved" | "hidden" | "deleted"): Promise<ActionResult> {
  return withAdmin("reviews.moderate", async () => {
    if (!id.safeParse(reviewId).success) return failure("Invalid review.");
    const supabase = await createServerSupabase();
    const { data: review } = await supabase.from("reviews").select("products(slug)").eq("id", reviewId).maybeSingle();
    const { error } = status === "deleted" ? await supabase.from("reviews").delete().eq("id", reviewId) : await supabase.from("reviews").update({ status }).eq("id", reviewId);
    if (error) throw error;
    const slug = (review?.products as unknown as { slug: string } | null)?.slug;
    refreshStore("/admin/reviews", ...(slug ? [`/books/${slug}`] : []));
    return { ok: true, message: status === "approved" ? "Review published." : status === "hidden" ? "Review hidden." : "Review deleted." };
  });
}

// ---------------------------------------------------------------- banners & FAQs
const bannerSchema = z.object({
  id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  placement: z.enum(["announcement", "hero", "promo"]),
  title: z.string().trim().min(1, "Enter the text").max(160),
  subtitle: z.string().trim().max(300).transform((v) => v || null),
  linkUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || v.startsWith("/") || /^https:\/\//.test(v), "Use a path like /books or a full https:// link")
    .transform((v) => v || null),
  linkLabel: z.string().trim().max(40).transform((v) => v || null),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  isActive: z.boolean(),
  startsAt: z.string().trim().transform((v) => (v ? new Date(`${v}:00+05:30`).toISOString() : null)),
  endsAt: z.string().trim().transform((v) => (v ? new Date(`${v}:00+05:30`).toISOString() : null)),
});

export async function saveBannerAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return withAdmin("banners.save", async () => {
    const parsed = bannerSchema.safeParse({ ...Object.fromEntries(formData), isActive: formData.get("isActive") === "on" });
    if (!parsed.success) return invalid(parsed.error);
    const b = parsed.data;
    const row = {
      placement: b.placement,
      title: b.title,
      subtitle: b.subtitle,
      link_url: b.linkUrl,
      link_label: b.linkLabel,
      sort_order: b.sortOrder,
      is_active: b.isActive,
      starts_at: b.startsAt,
      ends_at: b.endsAt,
    };
    const supabase = await createServerSupabase();
    const { error } = b.id ? await supabase.from("banners").update(row).eq("id", b.id) : await supabase.from("banners").insert(row);
    if (error) throw error;
    refreshStore("/admin/banners");
    return { ok: true, message: "Banner saved." };
  });
}

export async function deleteBannerAction(bannerId: string): Promise<ActionResult> {
  return withAdmin("banners.delete", async () => {
    if (!id.safeParse(bannerId).success) return failure("Invalid banner.");
    const { error } = await (await createServerSupabase()).from("banners").delete().eq("id", bannerId);
    if (error) throw error;
    refreshStore("/admin/banners");
    return { ok: true, message: "Banner deleted." };
  });
}

const faqSchema = z.object({
  id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  question: z.string().trim().min(3, "Enter the question").max(300),
  answer: z.string().trim().min(3, "Enter the answer").max(3000),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  isActive: z.boolean(),
});

export async function saveFaqAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return withAdmin("faqs.save", async () => {
    const parsed = faqSchema.safeParse({ ...Object.fromEntries(formData), isActive: formData.get("isActive") === "on" });
    if (!parsed.success) return invalid(parsed.error);
    const f = parsed.data;
    const row = { question: f.question, answer: f.answer, sort_order: f.sortOrder, is_active: f.isActive };
    const supabase = await createServerSupabase();
    const { error } = f.id ? await supabase.from("faqs").update(row).eq("id", f.id) : await supabase.from("faqs").insert(row);
    if (error) throw error;
    refreshStore("/admin/faqs", "/faq");
    return { ok: true, message: "FAQ saved." };
  });
}

export async function deleteFaqAction(faqId: string): Promise<ActionResult> {
  return withAdmin("faqs.delete", async () => {
    if (!id.safeParse(faqId).success) return failure("Invalid FAQ.");
    const { error } = await (await createServerSupabase()).from("faqs").delete().eq("id", faqId);
    if (error) throw error;
    refreshStore("/admin/faqs", "/faq");
    return { ok: true, message: "FAQ deleted." };
  });
}

export async function setMessageStatusAction(messageId: string, status: "new" | "read" | "resolved"): Promise<ActionResult> {
  return withAdmin("messages.status", async () => {
    if (!id.safeParse(messageId).success) return failure("Invalid message.");
    const { error } = await (await createServerSupabase()).from("contact_messages").update({ status }).eq("id", messageId);
    if (error) throw error;
    revalidatePath("/admin/messages");
    return { ok: true };
  });
}

// ---------------------------------------------------------------- settings
const MONEY_FIELDS = new Set(["flat_fee_paise", "free_above_paise", "fee_paise", "max_order_paise"]);

/**
 * Saves one settings section. Field names match the JSON keys; money fields are entered
 * in rupees; checkboxes are sent as "on". The section schema validates the final value.
 */
export async function saveSettingsAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return withAdmin("settings.save", async () => {
    const key = String(formData.get("section")) as SettingsKey;
    const schema = settingsSchemas[key];
    if (!schema) return failure("Unknown settings section.");
    const shape = (schema as unknown as z.ZodObject).shape as Record<string, z.ZodType>;
    const value: Record<string, unknown> = {};
    for (const field of Object.keys(shape)) {
      const raw = formData.get(field);
      const probe = shape[field].safeParse(true);
      if (probe.success && typeof probe.data === "boolean") {
        value[field] = raw === "on";
      } else if (MONEY_FIELDS.has(field)) {
        const text = String(raw ?? "").trim();
        value[field] = text === "" ? null : rupeesToPaise(text);
      } else if (field === "rate_bps") {
        value[field] = Math.round(Number(String(raw ?? "0")) * 100);
      } else if (shape[field].safeParse(0).success) {
        value[field] = Number(String(raw ?? ""));
      } else {
        value[field] = String(raw ?? "").trim();
      }
    }
    const parsed = schema.safeParse(value);
    if (!parsed.success) return invalid(parsed.error);
    const { error } = await (await createServerSupabase()).from("settings").upsert({ key, value: parsed.data }, { onConflict: "key" });
    if (error) throw error;
    refreshStore("/admin/settings");
    return { ok: true, message: "Settings saved." };
  });
}
