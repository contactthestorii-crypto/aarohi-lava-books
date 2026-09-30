import { NextResponse, type NextRequest } from "next/server";
import { rejectCrossSite } from "@/lib/http";
import { log } from "@/lib/utils/log";
import { orderAccessSchema } from "@/lib/validation/checkout";
import { CheckoutError, openGatewayPayment } from "@/services/checkout";
import { getOrderWithToken } from "@/services/order-access";

export const dynamic = "force-dynamic";

/** Re-opens the gateway for an unpaid order (same gateway order, same amount). */
export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const parsed = orderAccessSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const order = await getOrderWithToken(parsed.data.orderNumber, parsed.data.token);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  try {
    const payment = await openGatewayPayment(order.id);
    return NextResponse.json({ orderNumber: order.orderNumber, token: order.accessToken, payment });
  } catch (error) {
    if (error instanceof CheckoutError) return NextResponse.json({ error: error.userMessage }, { status: 422 });
    log.error("api.payments.retry", error);
    return NextResponse.json({ error: "Payment could not be started. Please try again." }, { status: 500 });
  }
}
