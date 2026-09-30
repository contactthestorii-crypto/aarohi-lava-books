import "server-only";
import { getShippingProvider, getShippingProviderByName, mapShiprocketStatus, shouldAdvanceStatus, type TrackingEvent } from "@/lib/shipping";
import { ShippingProviderError } from "@/lib/shipping/types";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";
import type { OrderStatus } from "@/types";
import { notifyCustomer } from "./notifications";
import { getOrderById } from "./order-queries";
import { getFreshSettings } from "./settings";

// Business logic for shipments. Provider specifics stay in src/lib/shipping.

export class ShipmentError extends Error {
  constructor(message: string, readonly userMessage: string) {
    super(message);
  }
}

const SHIPPABLE: OrderStatus[] = ["PAID", "PROCESSING", "PACKED"];

async function advanceOrder(orderId: string, next: OrderStatus | null, message: string | null) {
  if (!next) return;
  const supabase = getAdminSupabase();
  const { data: order } = await supabase.from("orders").select("status, payment_method, payment_status").eq("id", orderId).maybeSingle();
  if (!order || !shouldAdvanceStatus(order.status as OrderStatus, next)) return;
  const { error } = await supabase.rpc("set_order_status", { p_order_id: orderId, p_status: next, p_message: message, p_actor: "shipping" });
  if (error) throw error;
  if (next === "DELIVERED" && order.payment_method === "cod" && order.payment_status === "cod_pending") {
    await supabase.from("orders").update({ payment_status: "cod_collected" }).eq("id", orderId);
    await supabase.from("payments").update({ status: "cod_collected" }).eq("order_id", orderId).eq("method", "cod");
  }
  if (next === "SHIPPED") await notifyCustomer(orderId, "order_shipped");
  if (next === "DELIVERED") await notifyCustomer(orderId, "order_delivered");
}

/** Creates a shipment with the automated provider (Shiprocket) for a paid or COD order. */
export async function createShipmentForOrder(orderId: string) {
  const provider = getShippingProvider();
  if (!provider.automated) {
    throw new ShipmentError("Manual provider", "Automatic shipping is not configured. Enter the courier and AWB manually.");
  }
  const supabase = getAdminSupabase();
  const order = await getOrderById(supabase, orderId);
  if (!order) throw new ShipmentError("Order not found", "Order not found.");
  if (!SHIPPABLE.includes(order.status)) {
    throw new ShipmentError("Not shippable", "Only paid or processing orders can be shipped.");
  }
  if (order.shipments.some((s) => s.isActive)) throw new ShipmentError("Shipment exists", "This order already has an active shipment.");

  const settings = await getFreshSettings();
  const productIds = order.items.map((i) => i.productId).filter((id): id is string => Boolean(id));
  const { data: products } = await supabase.from("products").select("id, weight_grams, sku, isbn").in("id", productIds);
  const byId = new Map((products ?? []).map((p) => [p.id as string, p]));
  const weightGrams = order.items.reduce((sum, item) => {
    const weight = (item.productId && (byId.get(item.productId)?.weight_grams as number | null)) || settings.shipping.default_book_weight_grams;
    return sum + weight * item.quantity;
  }, 0);

  const result = await provider.createShipment({
    orderNumber: order.orderNumber,
    orderDate: new Date(order.createdAt),
    customer: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone },
    address: order.shippingAddress,
    items: order.items.map((item) => {
      const product = item.productId ? byId.get(item.productId) : undefined;
      return {
        name: item.title,
        sku: (product?.sku as string | null) || (product?.isbn as string | null) || item.productId || item.id,
        units: item.quantity,
        unitPricePaise: item.unitPricePaise,
      };
    }),
    paymentMethod: order.paymentMethod,
    subtotalPaise: order.subtotalPaise,
    discountPaise: order.discountPaise,
    shippingPaise: order.shippingPaise,
    totalPaise: order.totalPaise,
    weightGrams,
    dimensionsCm: {
      length: settings.shipping.package_length_cm,
      breadth: settings.shipping.package_breadth_cm,
      height: settings.shipping.package_height_cm,
    },
  });

  const { error } = await supabase.from("shipments").insert({
    order_id: orderId,
    provider: provider.name,
    provider_order_id: result.providerOrderId,
    provider_shipment_id: result.providerShipmentId,
    awb: result.awb,
    courier_name: result.courierName,
    tracking_url: result.trackingUrl,
    label_url: result.labelUrl,
    provider_status: result.providerStatus,
    status: mapShiprocketStatus(result.providerStatus) ?? "PACKED",
    is_active: true,
  });
  if (error) throw error;
  await advanceOrder(orderId, "PACKED", result.awb ? `Shipment created with ${result.courierName ?? "courier"} (AWB ${result.awb})` : "Shipment created");
  return result;
}

/** Records a shipment booked outside the system (manual provider). Marks the order shipped. */
export async function saveManualShipment(orderId: string, input: { courierName: string; awb: string; trackingUrl: string | null }) {
  const supabase = getAdminSupabase();
  const { data: order } = await supabase.from("orders").select("status").eq("id", orderId).maybeSingle();
  if (!order) throw new ShipmentError("Order not found", "Order not found.");
  if (![...SHIPPABLE, "SHIPPED"].includes(order.status as OrderStatus)) {
    throw new ShipmentError("Not shippable", "Only paid or processing orders can be shipped.");
  }
  await supabase.from("shipments").update({ is_active: false }).eq("order_id", orderId).eq("is_active", true);
  const { error } = await supabase.from("shipments").insert({
    order_id: orderId,
    provider: "manual",
    awb: input.awb,
    courier_name: input.courierName,
    tracking_url: input.trackingUrl,
    status: "SHIPPED",
    provider_status: "Shipped",
    is_active: true,
  });
  if (error) {
    if (error.code === "23505") throw new ShipmentError(error.message, "This AWB is already used by another shipment.");
    throw error;
  }
  await advanceOrder(orderId, "SHIPPED", `Shipped with ${input.courierName} (AWB ${input.awb})`);
}

async function storeTracking(shipmentId: string, orderId: string, update: {
  providerStatus: string | null;
  status: OrderStatus | null;
  estimatedDelivery?: string | null;
  trackingUrl?: string | null;
  courierName?: string | null;
  events: TrackingEvent[];
}) {
  const supabase = getAdminSupabase();
  if (update.events.length > 0) {
    const { error } = await supabase.from("shipping_events").upsert(
      update.events.map((event) => ({
        shipment_id: shipmentId,
        provider_status: event.providerStatus.slice(0, 120),
        mapped_status: event.status,
        location: event.location?.slice(0, 200) ?? null,
        description: event.description?.slice(0, 500) ?? null,
        occurred_at: event.occurredAt,
      })),
      { onConflict: "shipment_id,provider_status,occurred_at", ignoreDuplicates: true },
    );
    if (error) throw error;
  }
  const patch: Record<string, unknown> = { last_synced_at: new Date().toISOString() };
  if (update.providerStatus) patch.provider_status = update.providerStatus;
  if (update.status) patch.status = update.status;
  if (update.estimatedDelivery !== undefined) patch.estimated_delivery = update.estimatedDelivery;
  if (update.trackingUrl) patch.tracking_url = update.trackingUrl;
  if (update.courierName) patch.courier_name = update.courierName;
  await supabase.from("shipments").update(patch).eq("id", shipmentId);
  await advanceOrder(orderId, update.status, update.providerStatus ? `Courier update: ${update.providerStatus}` : null);
}

/** Pulls the latest tracking from the provider for an order's active shipment. */
export async function syncShipmentTracking(orderId: string) {
  const supabase = getAdminSupabase();
  const { data: shipment } = await supabase
    .from("shipments")
    .select("id, provider, awb")
    .eq("order_id", orderId)
    .eq("is_active", true)
    .maybeSingle();
  if (!shipment?.awb) throw new ShipmentError("No AWB", "This order has no shipment with a tracking number yet.");
  const provider = getShippingProviderByName(shipment.provider as string);
  if (!provider?.automated || !provider.isConfigured()) {
    throw new ShipmentError("Manual shipment", "Live tracking is not available for manually entered shipments.");
  }
  const tracking = await provider.track(shipment.awb as string);
  await storeTracking(shipment.id as string, orderId, tracking);
  return tracking;
}

/** Applies a verified provider webhook (e.g. Shiprocket) keyed by AWB. */
export async function applyShippingWebhook(input: {
  provider: string;
  awb: string;
  providerStatus: string;
  estimatedDelivery: string | null;
  events: TrackingEvent[];
}) {
  const supabase = getAdminSupabase();
  const { data: shipment } = await supabase
    .from("shipments")
    .select("id, order_id")
    .eq("provider", input.provider)
    .eq("awb", input.awb)
    .maybeSingle();
  if (!shipment) {
    log.warn("shipping.webhook", "Unknown AWB", { provider: input.provider, awb: input.awb });
    return false;
  }
  await storeTracking(shipment.id as string, shipment.order_id as string, {
    providerStatus: input.providerStatus,
    status: mapShiprocketStatus(input.providerStatus),
    estimatedDelivery: input.estimatedDelivery,
    events: input.events,
  });
  return true;
}

/** Admin-entered tracking event for manual shipments (e.g. "Out for delivery"). */
export async function addManualTrackingEvent(orderId: string, status: OrderStatus, note: string | null) {
  const supabase = getAdminSupabase();
  const { data: shipment } = await supabase.from("shipments").select("id").eq("order_id", orderId).eq("is_active", true).maybeSingle();
  if (!shipment) throw new ShipmentError("No shipment", "Add the courier and AWB first.");
  await storeTracking(shipment.id as string, orderId, {
    providerStatus: note || status.replace(/_/g, " "),
    status,
    events: [{ providerStatus: status.replace(/_/g, " "), status, location: null, description: note, occurredAt: new Date().toISOString() }],
  });
}

export async function cancelShipment(orderId: string) {
  const supabase = getAdminSupabase();
  const { data: shipment } = await supabase
    .from("shipments")
    .select("id, provider, provider_order_id")
    .eq("order_id", orderId)
    .eq("is_active", true)
    .maybeSingle();
  if (!shipment) return;
  const provider = getShippingProviderByName(shipment.provider as string);
  if (provider?.automated && shipment.provider_order_id) {
    try {
      await provider.cancel(shipment.provider_order_id as string);
    } catch (error) {
      if (error instanceof ShippingProviderError) throw new ShipmentError(error.message, error.userMessage);
      throw error;
    }
  }
  await supabase.from("shipments").update({ is_active: false, provider_status: "Cancelled" }).eq("id", shipment.id);
}
