import { NextResponse, type NextRequest } from "next/server";
import { rejectCrossSite } from "@/lib/http";
import { getUser } from "@/lib/auth";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";
import { quoteRequestSchema } from "@/lib/validation/checkout";
import { getCart } from "@/services/cart";

export const dynamic = "force-dynamic";

/** Server-computed totals for the checkout summary. The client sends no prices. */
export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  if (!isAdminClientConfigured()) return NextResponse.json({ error: "Checkout is not available yet." }, { status: 503 });
  const parsed = quoteRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    const user = await getUser();
    const cart = await getCart({
      paymentMethod: parsed.data.paymentMethod,
      couponCode: parsed.data.couponCode ?? undefined,
      customer: { userId: user?.id, email: parsed.data.email, phone: parsed.data.phone },
    });
    return NextResponse.json({ quote: cart.quote, hasIssues: cart.hasIssues, itemCount: cart.quote.itemCount });
  } catch (error) {
    log.error("api.checkout.quote", error);
    return NextResponse.json({ error: "Could not calculate your total. Please refresh." }, { status: 500 });
  }
}
