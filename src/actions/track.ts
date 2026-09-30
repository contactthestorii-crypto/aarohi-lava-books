"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { failure, type ActionResult } from "@/lib/action-result";
import { checkRateLimit, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { getOrderForTracking } from "@/services/order-access";

const schema = z.object({
  orderNumber: z.string().trim().toUpperCase().regex(/^AL\d{6}-[0-9A-F]{5}$/, "Enter the order ID from your confirmation, e.g. AL260930-1A2B3"),
  contact: z.string().trim().min(5, "Enter the phone number or email used at checkout").max(254),
});

/** Looks up an order by ID + phone/email and redirects to its tokenised status page. */
export async function trackOrderAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = schema.safeParse({ orderNumber: formData.get("orderNumber"), contact: formData.get("contact") });
  if (!parsed.success) {
    return { ok: false, error: "Please check the details.", fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  }
  if (!isAdminClientConfigured()) return failure("Order tracking is not available yet.");
  if (!(await checkRateLimit("trackOrder"))) return failure(RATE_LIMITED_MESSAGE);

  const order = await getOrderForTracking(parsed.data.orderNumber, parsed.data.contact);
  // Same message whether the order or the contact is wrong (no order enumeration).
  if (!order) return failure("We could not find an order with those details. Check the order ID and the phone number or email used at checkout.");
  redirect(`/order-success?order=${encodeURIComponent(order.orderNumber)}&token=${order.accessToken}`);
}
