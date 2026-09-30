import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { shiprocketConfig } from "@/lib/env";
import { safeEqual } from "@/lib/payments/signature";
import { mapShiprocketStatus } from "@/lib/shipping";
import { getAdminSupabase, isAdminClientConfigured } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";
import { applyShippingWebhook } from "@/services/shipping";

export const dynamic = "force-dynamic";

// Shiprocket tracking webhook (Settings > API > Webhooks). Shiprocket sends the token you
// configure as the "x-api-key" header. Note: Shiprocket rejects webhook URLs containing
// words like "shiprocket"; if so, add a rewrite such as /api/webhooks/courier -> this route.

const scanSchema = z.object({
  date: z.string(),
  status: z.string().optional(),
  activity: z.string().optional(),
  location: z.string().optional(),
  "sr-status-label": z.string().optional(),
});

const payloadSchema = z.object({
  awb: z.union([z.string(), z.number()]).transform(String),
  current_status: z.string(),
  current_timestamp: z.string().optional(),
  etd: z.string().nullable().optional(),
  scans: z.array(scanSchema).optional().default([]),
});

function istToIso(value: string): string {
  const normalised = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = Date.parse(/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalised) ? normalised : `${normalised}+05:30`);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
}

export async function POST(request: NextRequest) {
  const { webhookToken } = shiprocketConfig();
  const provided = request.headers.get("x-api-key") ?? "";
  if (!webhookToken || !safeEqual(provided, webhookToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminClientConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const raw = await request.text();
  let json: unknown;
  try {
    json = JSON.parse(raw || "{}");
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    // Shiprocket sends a test ping when saving the webhook; acknowledge it.
    return NextResponse.json({ ok: true, ignored: true });
  }
  const payload = parsed.data;
  const eventId = `${payload.awb}:${payload.current_status}:${payload.current_timestamp ?? ""}`;

  const supabase = getAdminSupabase();
  const { error: insertError } = await supabase
    .from("webhook_events")
    .insert({ provider: "shiprocket", event_id: eventId.slice(0, 200), event_type: payload.current_status, payload: json });
  if (insertError?.code === "23505") return NextResponse.json({ ok: true, duplicate: true });

  try {
    const events = payload.scans.map((scan) => {
      const status = scan["sr-status-label"] || scan.status || scan.activity || payload.current_status;
      return {
        providerStatus: status,
        status: mapShiprocketStatus(status),
        location: scan.location ?? null,
        description: scan.activity ?? null,
        occurredAt: istToIso(scan.date),
      };
    });
    await applyShippingWebhook({
      provider: "shiprocket",
      awb: payload.awb,
      providerStatus: payload.current_status,
      estimatedDelivery: payload.etd && !Number.isNaN(Date.parse(payload.etd)) ? istToIso(payload.etd) : null,
      events,
    });
    await supabase.from("webhook_events").update({ processed_at: new Date().toISOString() }).eq("provider", "shiprocket").eq("event_id", eventId.slice(0, 200));
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error("webhook.shiprocket", error, { awb: payload.awb });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
