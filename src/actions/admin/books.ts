"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { z } from "zod";
import { failure, invalid, type ActionResult } from "@/lib/action-result";
import { createServerSupabase } from "@/lib/supabase/server";
import { CATALOG_TAG } from "@/lib/supabase/public";
import { bookFormToObject, bookSchema } from "@/lib/validation/admin";
import { withAdmin } from "./guard";

// Catalog writes use the admin's own session, so RLS ("admin all" policies) enforces the
// role a second time in the database (defence in depth).

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function refresh(slug?: string) {
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/books");
  revalidatePath("/books");
  revalidatePath("/");
  if (slug) revalidatePath(`/books/${slug}`);
}

export async function saveBookAction(_prev: ActionResult<{ id: string }>, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const result = await withAdmin<{ id: string }>("books.save", async () => {
    const parsed = bookSchema.safeParse(bookFormToObject(formData));
    if (!parsed.success) return invalid(parsed.error);
    const book = parsed.data;
    if (!book.slug) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: { slug: "Enter a URL slug" } };

    const supabase = await createServerSupabase();
    const row = {
      title: book.title,
      slug: book.slug,
      subtitle: book.subtitle,
      author: book.author,
      author_bio: book.authorBio,
      description: book.description,
      key_features: book.keyFeatures,
      contents: book.contents,
      exam_coverage: book.examCoverage,
      exams: book.exams,
      keywords: book.keywords,
      sku: book.sku,
      isbn: book.isbn,
      publisher: book.publisher,
      edition: book.edition,
      publication_year: book.publicationYear,
      pages: book.pages,
      language: book.language,
      dimensions: book.dimensions,
      weight_grams: book.weightGrams,
      binding: book.binding,
      mrp_paise: book.mrpPaise,
      price_paise: book.pricePaise,
      status: book.status,
      is_featured: book.isFeatured,
      is_bestseller: book.isBestseller,
      primary_category_id: book.primaryCategoryId && book.categoryIds.includes(book.primaryCategoryId) ? book.primaryCategoryId : book.categoryIds[0] ?? null,
      seo_title: book.seoTitle,
      seo_description: book.seoDescription,
    };

    const saved = book.id
      ? await supabase.from("products").update(row).eq("id", book.id).select("id").single()
      : await supabase.from("products").insert(row).select("id").single();
    if (saved.error) {
      if (saved.error.code === "23505") {
        const field = saved.error.message.includes("isbn") ? "isbn" : saved.error.message.includes("sku") ? "sku" : "slug";
        const label = { isbn: "ISBN", sku: "SKU", slug: "URL slug" }[field];
        return { ok: false, error: "Please check the highlighted fields.", fieldErrors: { [field]: `This ${label} is already used by another book` } };
      }
      throw saved.error;
    }
    const id = saved.data.id as string;

    // Categories: replace the set.
    await supabase.from("product_categories").delete().eq("product_id", id);
    if (book.categoryIds.length > 0) {
      const { error } = await supabase.from("product_categories").insert(book.categoryIds.map((categoryId) => ({ product_id: id, category_id: categoryId })));
      if (error) throw error;
    }

    // Stock: `reserved` is never touched here (it belongs to pending orders).
    const { data: inventory } = await supabase.from("inventory").select("reserved").eq("product_id", id).maybeSingle();
    const reserved = (inventory?.reserved as number | undefined) ?? 0;
    if (!book.allowBackorder && book.quantity < reserved) {
      return { ok: false, error: "Please check the highlighted fields.", fieldErrors: { quantity: `${reserved} copies are reserved by unpaid orders; stock cannot go below that.` } };
    }
    const { error: stockError } = await supabase
      .from("inventory")
      .upsert({ product_id: id, quantity: book.quantity, low_stock_threshold: book.lowStockThreshold, allow_backorder: book.allowBackorder }, { onConflict: "product_id" });
    if (stockError) throw stockError;

    refresh(book.slug);
    return { ok: true, message: "Book saved.", data: { id } };
  });
  if (result.ok && !String(formData.get("id") ?? "") && result.data) redirect(`/admin/books/${result.data.id}?created=1`);
  return result;
}

export async function setBookStatusAction(productId: string, status: "draft" | "published" | "archived"): Promise<ActionResult> {
  return withAdmin("books.status", async () => {
    if (!z.uuid().safeParse(productId).success) return failure("Invalid book.");
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.from("products").update({ status }).eq("id", productId).select("slug").single();
    if (error) throw error;
    refresh(data.slug as string);
    return { ok: true, message: status === "archived" ? "Book archived. It is hidden from the store." : `Book is now ${status}.` };
  });
}

export async function uploadBookImagesAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return withAdmin("books.upload", async () => {
    const productId = z.uuid().safeParse(formData.get("productId"));
    if (!productId.success) return failure("Save the book before adding images.");
    const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) return failure("Choose at least one image.");
    if (files.length > 10) return failure("Upload up to 10 images at a time.");

    const supabase = await createServerSupabase();
    const { data: product } = await supabase.from("products").select("slug, title").eq("id", productId.data).single();
    const { count } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId.data);
    let sortOrder = count ?? 0;

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) return failure(`${file.name}: only JPEG, PNG or WebP images are allowed.`);
      if (file.size > MAX_UPLOAD_BYTES) return failure(`${file.name}: images must be 5 MB or smaller.`);
      // Re-encode: strips metadata, verifies it is really an image, and optimises size.
      let output: { data: Buffer; info: { width: number; height: number } };
      try {
        output = await sharp(Buffer.from(await file.arrayBuffer()))
          .rotate()
          .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer({ resolveWithObject: true });
      } catch {
        return failure(`${file.name} could not be read as an image.`);
      }
      const path = `${productId.data}/${randomUUID()}.webp`;
      const upload = await supabase.storage.from("product-images").upload(path, output.data, { contentType: "image/webp", upsert: false });
      if (upload.error) throw upload.error;
      const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(path);
      const { error } = await supabase.from("product_images").insert({
        product_id: productId.data,
        url: publicUrl.publicUrl,
        storage_path: path,
        alt: `${product?.title ?? "Book"} ${sortOrder === 0 ? "cover" : `image ${sortOrder + 1}`}`,
        width: output.info.width,
        height: output.info.height,
        sort_order: sortOrder,
      });
      if (error) throw error;
      sortOrder += 1;
    }
    refresh(product?.slug as string | undefined);
    revalidatePath(`/admin/books/${productId.data}`);
    return { ok: true, message: `${files.length} ${files.length === 1 ? "image" : "images"} uploaded.` };
  });
}

export async function deleteBookImageAction(imageId: string): Promise<ActionResult> {
  return withAdmin("books.image.delete", async () => {
    if (!z.uuid().safeParse(imageId).success) return failure("Invalid image.");
    const supabase = await createServerSupabase();
    const { data: image, error } = await supabase.from("product_images").select("id, product_id, storage_path, products(slug)").eq("id", imageId).single();
    if (error) throw error;
    if (image.storage_path) await supabase.storage.from("product-images").remove([image.storage_path as string]);
    await supabase.from("product_images").delete().eq("id", imageId);
    const slug = (image.products as unknown as { slug: string } | null)?.slug;
    refresh(slug);
    revalidatePath(`/admin/books/${image.product_id}`);
    return { ok: true, message: "Image removed." };
  });
}

/** Moves an image one place earlier (cover = first) or later. */
export async function moveBookImageAction(imageId: string, direction: "up" | "down"): Promise<ActionResult> {
  return withAdmin("books.image.move", async () => {
    if (!z.uuid().safeParse(imageId).success) return failure("Invalid image.");
    const supabase = await createServerSupabase();
    const { data: image } = await supabase.from("product_images").select("id, product_id").eq("id", imageId).single();
    if (!image) return failure("Image not found.");
    const { data: images } = await supabase.from("product_images").select("id").eq("product_id", image.product_id).order("sort_order").order("created_at");
    const ids = (images ?? []).map((i) => i.id as string);
    const index = ids.indexOf(imageId);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= ids.length) return { ok: true };
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await Promise.all(ids.map((id, sortOrder) => supabase.from("product_images").update({ sort_order: sortOrder }).eq("id", id)));
    updateTag(CATALOG_TAG);
    revalidatePath(`/admin/books/${image.product_id}`);
    return { ok: true };
  });
}
