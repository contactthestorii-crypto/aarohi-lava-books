import "server-only";
import { shiprocketConfig } from "@/lib/env";
import { log } from "@/lib/utils/log";
import { mapShiprocketStatus } from "./status-map";
import {
  ShippingProviderError,
  type ServiceabilityResult,
  type ShipmentRequest,
  type ShipmentResult,
  type ShippingProvider,
  type TrackingEvent,
  type TrackingResult,
} from "./types";

// Shiprocket REST adapter (https://apidocs.shiprocket.in). Uses an API user's email and
// password (SHIPPING_API_KEY / SHIPPING_API_SECRET) to obtain a bearer token (valid ~10 days).

const BASE = "https://apiv2.shiprocket.in/v1/external";
const TOKEN_TTL_MS = 8 * 24 * 60 * 60 * 1000;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function token(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;
  const config = shiprocketConfig();
  if (!config.configured) throw new ShippingProviderError("Shiprocket is not configured");
  const response = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: config.email, password: config.password }),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as { token?: string; message?: string };
  if (!response.ok || !body.token) throw new ShippingProviderError(`Shiprocket login failed: ${response.status} ${body.message ?? ""}`);
  cachedToken = { token: body.token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return body.token;
}

async function call<T>(path: string, init: RequestInit = {}, retried = false): Promise<{ status: number; body: T }> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}`, ...init.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 401 && !retried) {
    cachedToken = null;
    return call<T>(path, init, true);
  }
  const body = (await response.json().catch(() => ({}))) as T;
  if (response.status >= 500) throw new ShippingProviderError(`Shiprocket ${path} failed with ${response.status}`);
  return { status: response.status, body };
}

interface CourierOption {
  courier_company_id: number;
  courier_name: string;
  estimated_delivery_days?: string | number;
  cod?: number;
}

function toDays(value: string | number | undefined): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function formatOrderDate(date: Date): string {
  // Shiprocket expects "YYYY-MM-DD HH:mm" in IST.
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 16).replace("T", " ");
}

function rupees(paise: number): number {
  return Math.round(paise) / 100;
}

export const shiprocketProvider: ShippingProvider = {
  name: "shiprocket",
  automated: true,
  isConfigured: () => shiprocketConfig().configured,

  async checkServiceability(pincode, { weightGrams, cod }): Promise<ServiceabilityResult> {
    const { pickupPincode } = shiprocketConfig();
    const params = new URLSearchParams({
      pickup_postcode: pickupPincode,
      delivery_postcode: pincode,
      weight: String(Math.max(weightGrams, 100) / 1000),
      cod: cod ? "1" : "0",
    });
    const { status, body } = await call<{ data?: { available_courier_companies?: CourierOption[]; recommended_courier_company_id?: number } }>(
      `/courier/serviceability/?${params}`,
    );
    const couriers = body.data?.available_courier_companies ?? [];
    if (status === 404 || couriers.length === 0) {
      return { serviceable: false, codAvailable: false, estimatedDays: null, courierName: null };
    }
    const recommended = couriers.find((c) => c.courier_company_id === body.data?.recommended_courier_company_id) ?? couriers[0];
    const days = couriers.map((c) => toDays(c.estimated_delivery_days)).filter((d): d is number => d !== null);
    return {
      serviceable: true,
      codAvailable: couriers.some((c) => c.cod === 1),
      estimatedDays: days.length ? Math.min(...days) : null,
      courierName: recommended?.courier_name ?? null,
    };
  },

  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    const { pickupLocation } = shiprocketConfig();
    const [firstName, ...rest] = request.customer.name.trim().split(/\s+/);
    const address = [request.address.line1, request.address.line2].filter(Boolean).join(", ");
    const address2 = [request.address.area, request.address.landmark ? `Near ${request.address.landmark}` : null].filter(Boolean).join(", ");

    const created = await call<{ order_id?: number; shipment_id?: number; status?: string; message?: string; errors?: unknown }>(
      "/orders/create/adhoc",
      {
        method: "POST",
        body: JSON.stringify({
          order_id: request.orderNumber,
          order_date: formatOrderDate(request.orderDate),
          pickup_location: pickupLocation,
          billing_customer_name: firstName,
          billing_last_name: rest.join(" ") || ".",
          billing_address: address,
          billing_address_2: address2,
          billing_city: request.address.city,
          billing_pincode: request.address.pincode,
          billing_state: request.address.state,
          billing_country: "India",
          billing_email: request.customer.email,
          billing_phone: request.customer.phone,
          shipping_is_billing: true,
          order_items: request.items.map((item) => ({
            name: item.name.slice(0, 200),
            sku: item.sku.slice(0, 50),
            units: item.units,
            selling_price: rupees(item.unitPricePaise),
          })),
          payment_method: request.paymentMethod === "cod" ? "COD" : "Prepaid",
          shipping_charges: rupees(request.shippingPaise),
          total_discount: rupees(request.discountPaise),
          sub_total: rupees(request.subtotalPaise),
          length: request.dimensionsCm.length,
          breadth: request.dimensionsCm.breadth,
          height: request.dimensionsCm.height,
          weight: Math.max(request.weightGrams, 100) / 1000,
        }),
      },
    );
    if (!created.body.shipment_id) {
      log.error("shiprocket.createOrder", created.body, { orderNumber: request.orderNumber });
      throw new ShippingProviderError(
        `Shiprocket order creation failed: ${created.body.message ?? created.status}`,
        `Shiprocket rejected the shipment: ${created.body.message ?? "unknown error"}`,
      );
    }

    const shipmentId = String(created.body.shipment_id);
    const awb = await call<{ awb_assign_status?: number; response?: { data?: { awb_code?: string; courier_name?: string } }; message?: string }>(
      "/courier/assign/awb",
      { method: "POST", body: JSON.stringify({ shipment_id: shipmentId }) },
    );
    const awbCode = awb.body.response?.data?.awb_code || null;
    if (!awbCode) log.warn("shiprocket.assignAwb", awb.body.message ?? "AWB not assigned", { shipmentId });

    let labelUrl: string | null = null;
    if (awbCode) {
      await call("/courier/generate/pickup", { method: "POST", body: JSON.stringify({ shipment_id: [shipmentId] }) }).catch((error) =>
        log.warn("shiprocket.pickup", String(error), { shipmentId }),
      );
      const label = await call<{ label_url?: string }>("/courier/generate/label", {
        method: "POST",
        body: JSON.stringify({ shipment_id: [shipmentId] }),
      }).catch(() => null);
      labelUrl = label?.body.label_url ?? null;
    }

    return {
      providerOrderId: created.body.order_id ? String(created.body.order_id) : null,
      providerShipmentId: shipmentId,
      awb: awbCode,
      courierName: awb.body.response?.data?.courier_name ?? null,
      trackingUrl: awbCode ? `https://shiprocket.co/tracking/${awbCode}` : null,
      labelUrl,
      providerStatus: awbCode ? "AWB ASSIGNED" : created.body.status ?? "NEW",
    };
  },

  async track(awb: string): Promise<TrackingResult> {
    type Activity = { date: string; status?: string; activity?: string; location?: string; "sr-status-label"?: string };
    const { body } = await call<{
      tracking_data?: {
        shipment_track?: { current_status?: string; courier_name?: string; edd?: string | null }[];
        shipment_track_activities?: Activity[] | null;
        track_url?: string;
        etd?: string;
      };
    }>(`/courier/track/awb/${encodeURIComponent(awb)}`);
    const data = body.tracking_data;
    const current = data?.shipment_track?.[0];
    const events: TrackingEvent[] = (data?.shipment_track_activities ?? []).map((activity) => {
      const providerStatus = activity["sr-status-label"] || activity.status || activity.activity || "UPDATE";
      return {
        providerStatus,
        status: mapShiprocketStatus(providerStatus),
        location: activity.location ?? null,
        description: activity.activity ?? null,
        occurredAt: new Date(activity.date.replace(" ", "T") + "+05:30").toISOString(),
      };
    });
    const eta = current?.edd || data?.etd || null;
    return {
      providerStatus: current?.current_status ?? null,
      status: mapShiprocketStatus(current?.current_status),
      courierName: current?.courier_name ?? null,
      trackingUrl: data?.track_url ?? `https://shiprocket.co/tracking/${awb}`,
      estimatedDelivery: eta && !Number.isNaN(Date.parse(eta)) ? new Date(eta).toISOString() : null,
      events,
    };
  },

  async cancel(providerOrderId: string) {
    const { status, body } = await call<{ message?: string }>("/orders/cancel", {
      method: "POST",
      body: JSON.stringify({ ids: [Number(providerOrderId)] }),
    });
    if (status >= 400) throw new ShippingProviderError(`Shiprocket cancel failed: ${body.message ?? status}`);
  },
};
