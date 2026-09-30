"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failure, invalid, type ActionResult } from "@/lib/action-result";
import { getProfile } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";
import { getFreshSettings } from "@/services/settings";

const schema = z.object({
  productId: z.uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(10, "Write at least a sentence (10 characters)").max(3000),
});

const PURCHASED_STATUSES = ["PAID", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

/**
 * Reviews are inserted on the server so "verified purchase" and moderation status are
 * computed here and cannot be set by the client (RLS denies direct inserts).
 */
export async function submitReview(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return failure("Please sign in to write a review.");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  if (!(await checkRateLimit("review", profile.id))) return failure(RATE_LIMITED_MESSAGE);

  try {
    const supabase = getAdminSupabase();
    const settings = await getFreshSettings();
    const { data: purchases } = await supabase
      .from("order_items")
      .select("id, orders!inner(user_id, status)")
      .eq("product_id", parsed.data.productId)
      .eq("orders.user_id", profile.id)
      .in("orders.status", PURCHASED_STATUSES)
      .limit(1);
    const verified = (purchases ?? []).length > 0;
    if (settings.reviews.verified_only && !verified) {
      return failure("Only customers who bought this book can review it.");
    }

    const authorName = (profile.fullName || profile.email?.split("@")[0] || "Reader").slice(0, 80);
    const { error } = await supabase.from("reviews").insert({
      product_id: parsed.data.productId,
      user_id: profile.id,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body,
      author_name: authorName,
      verified_purchase: verified,
      status: settings.reviews.moderation ? "pending" : "approved",
    });
    if (error) {
      if (error.code === "23505") return failure("You have already reviewed this book.");
      throw error;
    }
    revalidatePath(`/books/${parsed.data.slug}`);
    return {
      ok: true,
      message: settings.reviews.moderation
        ? "Thank you. Your review will appear after it is approved."
        : "Thank you. Your review is published.",
    };
  } catch (error) {
    log.error("reviews.submit", error);
    return failure("We could not save your review. Please try again.");
  }
}
