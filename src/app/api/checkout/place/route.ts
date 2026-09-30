import { NextResponse, type NextRequest } from "next/server";
import { rejectCrossSite } from "@/lib/http";
import { PaymentError } from "@/lib/payments";
import { checkRateLimit, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";
import { CheckoutError, placeOrder } from "@/services/checkout";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  if (!isAdminClientConfigured()) {
    return NextResponse.json({ error: "The store is not accepting orders yet." }, { status: 503 });
  }
  if (!(await checkRateLimit("placeOrder"))) return NextResponse.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  try {
    const order = await placeOrder(body);
    return NextResponse.json({
      orderNumber: order.orderNumber,
      token: order.accessToken,
      status: order.status,
      totalPaise: order.totalPaise,
      payment: order.payment,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.userMessage, code: error.code }, { status: 422 });
    }
    if (error instanceof PaymentError) return NextResponse.json({ error: error.userMessage }, { status: 502 });
    log.error("api.checkout.place", error);
    return NextResponse.json({ error: "We could not place your order. You have not been charged. Please try again." }, { status: 500 });
  }
}
