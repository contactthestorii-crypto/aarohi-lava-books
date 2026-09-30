import { NextResponse, type NextRequest } from "next/server";
import { cronSecret } from "@/lib/env";
import { safeEqual } from "@/lib/payments/signature";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";
import { expirePendingOrders } from "@/services/orders";

export const dynamic = "force-dynamic";

/**
 * Cancels unpaid online orders whose payment window has closed and releases their stock.
 * Called by Vercel Cron (vercel.json) with "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(request: NextRequest) {
  const secret = cronSecret();
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminClientConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  try {
    const cancelled = await expirePendingOrders();
    return NextResponse.json({ cancelled });
  } catch (error) {
    log.error("cron.expireOrders", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
