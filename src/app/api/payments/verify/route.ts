import { NextResponse, type NextRequest } from "next/server";
import { rejectCrossSite } from "@/lib/http";
import { z } from "zod";
import { getPaymentProviderByName, PaymentError } from "@/lib/payments";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";
import { orderAccessSchema } from "@/lib/validation/checkout";
import { clearCart, getCart } from "@/services/cart";
import { getOrderWithToken } from "@/services/order-access";
import { finalizeOnlinePayment, recordFailedPayment } from "@/services/orders";

export const dynamic = "force-dynamic";

const schema = orderAccessSchema.extend({
  providerOrderId: z.string().min(3).max(100),
  providerPaymentId: z.string().min(3).max(100),
  signature: z.string().min(3).max(200),
});

/**
 * Browser callback after the gateway reports success. The signature is verified and the
 * payment is confirmed with the gateway before the order is marked paid. The webhook does
 * the same independently, and finalisation is idempotent.
 */
export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });
  const input = parsed.data;

  const order = await getOrderWithToken(input.orderNumber, input.token);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const payment = order.payments.find((p) => p.providerOrderId === input.providerOrderId);
  const provider = payment ? getPaymentProviderByName(payment.provider) : null;
  if (!payment || !provider) return NextResponse.json({ error: "This payment does not belong to the order." }, { status: 400 });

  const redirect = `/order-success?order=${encodeURIComponent(order.orderNumber)}&token=${order.accessToken}`;
  if (order.paymentStatus === "captured") return NextResponse.json({ status: "paid", redirect });

  try {
    const confirmed = await provider.confirmClientPayment(
      { providerOrderId: input.providerOrderId, providerPaymentId: input.providerPaymentId, signature: input.signature },
      order.totalPaise,
    );
    if (confirmed.status === "failed") {
      await recordFailedPayment(provider.name, input.providerOrderId, input.providerPaymentId, "FAILED", "Payment failed at the gateway");
      return NextResponse.json({ status: "failed", error: "The payment did not go through. You have not been charged." }, { status: 402 });
    }
    if (confirmed.status === "pending") {
      // Not captured yet: the webhook completes the order when the gateway confirms it.
      return NextResponse.json({ status: "pending", redirect });
    }
    await finalizeOnlinePayment({
      orderId: order.id,
      provider: provider.name,
      providerOrderId: confirmed.providerOrderId,
      providerPaymentId: confirmed.providerPaymentId,
      amountPaise: confirmed.amountPaise,
      raw: confirmed.raw,
    });
    // The buyer's cart (this browser / account) has been turned into the order.
    const cart = await getCart().catch(() => null);
    if (cart?.id) await clearCart(cart.id);
    const { data: paid } = await getAdminSupabase().from("orders").select("payment_status").eq("id", order.id).single();
    return NextResponse.json({ status: paid?.payment_status === "captured" ? "paid" : "pending", redirect });
  } catch (error) {
    log.error("api.payments.verify", error, { orderNumber: order.orderNumber });
    const message = error instanceof PaymentError ? error.userMessage : "We could not confirm your payment yet. If money was debited, your order will update automatically.";
    return NextResponse.json({ status: "error", error: message, redirect }, { status: 502 });
  }
}
