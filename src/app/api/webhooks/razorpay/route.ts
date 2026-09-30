import { NextResponse, type NextRequest } from "next/server";
import { razorpayProvider } from "@/lib/payments/razorpay";
import { getAdminSupabase, isAdminClientConfigured } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";
import { finalizeOnlinePayment, findOrderIdByProviderOrder, recordFailedPayment, recordRefund } from "@/services/orders";

export const dynamic = "force-dynamic";

/**
 * Razorpay webhook. Configure in Razorpay Dashboard > Webhooks with events:
 * payment.captured, order.paid, payment.failed, refund.processed.
 * 1. Signature verified on the raw body (constant time).
 * 2. Event id stored in webhook_events (unique) so retries are processed once.
 * 3. State changes go through idempotent DB functions.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!razorpayProvider.verifyWebhook(rawBody, request.headers)) {
    log.warn("webhook.razorpay", "Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  if (!isAdminClientConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  let event;
  try {
    event = razorpayProvider.parseWebhook(rawBody, request.headers);
  } catch (error) {
    log.error("webhook.razorpay.parse", error);
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id, processed_at")
    .eq("provider", "razorpay")
    .eq("event_id", event.id)
    .maybeSingle();
  if (existing?.processed_at) return NextResponse.json({ ok: true, duplicate: true });
  if (!existing) {
    const { error } = await supabase.from("webhook_events").insert({
      provider: "razorpay",
      event_id: event.id,
      event_type: event.type === "ignored" ? event.name : event.type,
      payload: JSON.parse(rawBody),
    });
    // Unique violation: a concurrent delivery is handling it.
    if (error?.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
    if (error) throw error;
  }

  try {
    if (event.type === "payment.captured") {
      const orderId = await findOrderIdByProviderOrder("razorpay", event.providerOrderId);
      if (orderId) {
        await finalizeOnlinePayment({
          orderId,
          provider: "razorpay",
          providerOrderId: event.providerOrderId,
          providerPaymentId: event.providerPaymentId,
          amountPaise: event.amountPaise,
          raw: event.raw,
        });
      } else {
        log.warn("webhook.razorpay", "Payment for unknown order", { providerOrderId: event.providerOrderId });
      }
    } else if (event.type === "payment.failed") {
      await recordFailedPayment("razorpay", event.providerOrderId, event.providerPaymentId, event.errorCode, event.errorDescription);
    } else if (event.type === "refund.processed") {
      const orderId = await findOrderIdByProviderOrder("razorpay", event.providerOrderId);
      if (orderId) await recordRefund(orderId, event.refundedTotalPaise, "Refund processed by Razorpay");
    }
    await supabase.from("webhook_events").update({ processed_at: new Date().toISOString(), error: null }).eq("provider", "razorpay").eq("event_id", event.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error("webhook.razorpay.process", error, { eventId: event.id });
    await supabase.from("webhook_events").update({ error: String(error).slice(0, 500) }).eq("provider", "razorpay").eq("event_id", event.id);
    // 500 makes Razorpay retry later.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
