import "server-only";
import { safeEqual } from "@/lib/payments/signature";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getOrderByNumber, type OrderDetailView } from "./order-queries";

// Guest access to an order without an account (docs/SECURITY.md): either the unguessable
// per-order access token (confirmation links), or order number + matching phone/email
// (tracking form). Failures return null without revealing which part was wrong.

export async function getOrderWithToken(orderNumber: string, token: string): Promise<OrderDetailView | null> {
  const order = await getOrderByNumber(getAdminSupabase(), orderNumber.toUpperCase());
  if (!order || !safeEqual(order.accessToken, token)) return null;
  return order;
}

function normalisePhone(value: string): string {
  return value.replace(/\D/g, "").slice(-10);
}

export async function getOrderForTracking(orderNumber: string, contact: string): Promise<OrderDetailView | null> {
  const order = await getOrderByNumber(getAdminSupabase(), orderNumber.toUpperCase());
  if (!order) return null;
  const value = contact.trim().toLowerCase();
  const matches = value.includes("@")
    ? safeEqual(order.customerEmail.toLowerCase(), value)
    : normalisePhone(value).length === 10 && safeEqual(order.customerPhone, normalisePhone(value));
  return matches ? order : null;
}
