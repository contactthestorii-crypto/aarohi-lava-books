import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { log } from "@/lib/utils/log";
import { orderAccessSchema } from "@/lib/validation/checkout";
import { getOrderWithToken } from "@/services/order-access";
import { recordFailedPayment } from "@/services/orders";

export const dynamic = "force-dynamic";

const schema = orderAccessSchema.extend({
  providerOrderId: z.string().min(3).max(100),
  providerPaymentId: z.string().max(100).optional().default(""),
  code: z.string().max(100).optional().default("PAYMENT_FAILED"),
  description: z.string().max(500).optional().default("Payment failed"),
});

/** Records a failed attempt reported by the browser (informational; the order stays payable). */
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const order = await getOrderWithToken(parsed.data.orderNumber, parsed.data.token);
  if (!order) return NextResponse.json({ ok: false }, { status: 404 });
  const payment = order.payments.find((p) => p.providerOrderId === parsed.data.providerOrderId);
  if (!payment) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    await recordFailedPayment(payment.provider, parsed.data.providerOrderId, parsed.data.providerPaymentId, parsed.data.code, parsed.data.description);
  } catch (error) {
    log.error("api.payments.failed", error);
  }
  return NextResponse.json({ ok: true });
}
