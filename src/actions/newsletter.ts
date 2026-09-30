"use server";

import { z } from "zod";
import { failure, type ActionResult } from "@/lib/action-result";
import { checkRateLimit, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";
import { getAdminSupabase, isAdminClientConfigured } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";
import { emailField } from "@/lib/validation/common";

const schema = z.object({ email: emailField });

export async function subscribeNewsletter(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return failure("Enter a valid email address.");
  if (!isAdminClientConfigured()) return failure("Sign-ups are not available yet. Please try again later.");
  if (!(await checkRateLimit("newsletter"))) return failure(RATE_LIMITED_MESSAGE);

  const { error } = await getAdminSupabase().from("newsletter_subscribers").insert({ email: parsed.data.email });
  // A duplicate email is not an error for the visitor.
  if (error && error.code !== "23505") {
    log.error("newsletter.subscribe", error);
    return failure("We could not save your email right now. Please try again.");
  }
  return { ok: true, message: "Thanks. We will email you when a new book is published." };
}
