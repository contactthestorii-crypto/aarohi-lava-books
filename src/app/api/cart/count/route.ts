import { NextResponse } from "next/server";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";
import { getCartCount } from "@/services/cart";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdminClientConfigured()) return NextResponse.json({ count: 0 });
  try {
    return NextResponse.json({ count: await getCartCount() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    log.error("api.cart.count", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
