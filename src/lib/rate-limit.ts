import "server-only";
import { headers } from "next/headers";
import { getAdminSupabase, isAdminClientConfigured } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";

export const RATE_LIMITS = {
  trackOrder: { limit: 10, windowSeconds: 600 },
  coupon: { limit: 20, windowSeconds: 600 },
  pincode: { limit: 30, windowSeconds: 600 },
  placeOrder: { limit: 10, windowSeconds: 600 },
  contact: { limit: 5, windowSeconds: 3600 },
  newsletter: { limit: 5, windowSeconds: 3600 },
  review: { limit: 5, windowSeconds: 3600 },
  search: { limit: 120, windowSeconds: 60 },
} as const;

export type RateLimitName = keyof typeof RATE_LIMITS;

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Returns true when the request may proceed. Fails open (allows) if the limiter itself is
 * unavailable, so a database hiccup does not block checkout; the event is logged.
 */
export async function checkRateLimit(name: RateLimitName, identity?: string): Promise<boolean> {
  if (!isAdminClientConfigured()) return true;
  const { limit, windowSeconds } = RATE_LIMITS[name];
  const key = `${name}:${identity ?? (await clientIp())}`;
  const { data, error } = await getAdminSupabase().rpc("rate_limit_hit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    log.error("rate-limit", error, { name });
    return true;
  }
  return data === true;
}

export const RATE_LIMITED_MESSAGE = "Too many attempts. Please wait a few minutes and try again.";
