"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failure, invalid, type ActionResult } from "@/lib/action-result";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { rupeesToPaise } from "@/lib/utils/money";
import { ORDER_STATUSES } from "@/types";
import { cancelOrder, refundOrder, setOrderStatus } from "@/services/orders";
import { addManualTrackingEvent, cancelShipment, createShipmentForOrder, saveManualShipment, syncShipmentTracking } from "@/services/shipping";
import { withAdmin } from "./guard";

const id = z.uuid();

function done(orderId: string, message: string): ActionResult {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true, message };
}

export async function updateOrderStatusAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return withAdmin("orders.status", async () => {
    const parsed = z
      .object({ orderId: id, status: z.enum(ORDER_STATUSES), note: z.string().trim().max(300).optional() })
      .safeParse(Object.fromEntries(formData));
    if (!parsed.success) return invalid(parsed.error);
    await setOrderStatus(parsed.data.orderId, parsed.data.status, parsed.data.note || null, "admin");
    return done(parsed.data.orderId, "Status updated. The customer is emailed for key steps.");
  });
}

export async function cancelOrderAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return withAdmin("orders.cancel", async () => {
    const parsed = z
      .object({ orderId: id, reason: z.string().trim().min(3, "Give a short reason").max(300), restock: z.string().optional() })
      .safeParse(Object.fromEntries(formData));
    if (!parsed.success) return invalid(parsed.error);
    await cancelShipment(parsed.data.orderId).catch(() => undefined);
    await cancelOrder(parsed.data.orderId, parsed.data.reason, "admin", parsed.data.restock === "on");
    return done(parsed.data.orderId, "Order cancelled. Refund any online payment separately.");
  });
}

export async function refundOrderAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return withAdmin("orders.refund", async () => {
    const parsed = z.object({ orderId: id, amount: z.string(), reason: z.string().trim().min(3, "Give a short reason").max(250) }).safeParse(Object.fromEntries(formData));
    if (!parsed.success) return invalid(parsed.error);
    const paise = rupeesToPaise(parsed.data.amount);
    if (!paise) return { ok: false, error: "Enter the refund amount in rupees.", fieldErrors: { amount: "Enter an amount" } };
    await refundOrder(parsed.data.orderId, paise, parsed.data.reason);
    return done(parsed.data.orderId, "Refund requested with the payment gateway and recorded.");
  });
}

export async function createShipmentAction(orderId: string): Promise<ActionResult> {
  return withAdmin("orders.shipment", async () => {
    if (!id.safeParse(orderId).success) return failure("Invalid order.");
    const result = await createShipmentForOrder(orderId);
    return done(orderId, result.awb ? `Shipment created. AWB ${result.awb}.` : "Shipment created. AWB not assigned yet; sync again shortly.");
  });
}

export async function saveManualShipmentAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return withAdmin("orders.manualShipment", async () => {
    const parsed = z
      .object({
        orderId: id,
        courierName: z.string().trim().min(2, "Enter the courier name").max(80),
        awb: z.string().trim().min(4, "Enter the tracking number").max(40).regex(/^[A-Za-z0-9-]+$/, "Letters, numbers and hyphens only"),
        trackingUrl: z.union([z.literal(""), z.url("Enter a full link starting with https://").max(500)]),
      })
      .safeParse(Object.fromEntries(formData));
    if (!parsed.success) return invalid(parsed.error);
    await saveManualShipment(parsed.data.orderId, {
      courierName: parsed.data.courierName,
      awb: parsed.data.awb.toUpperCase(),
      trackingUrl: parsed.data.trackingUrl || null,
    });
    return done(parsed.data.orderId, "Shipment saved and the customer has been notified.");
  });
}

export async function syncTrackingAction(orderId: string): Promise<ActionResult> {
  return withAdmin("orders.sync", async () => {
    if (!id.safeParse(orderId).success) return failure("Invalid order.");
    const tracking = await syncShipmentTracking(orderId);
    return done(orderId, `Tracking synced: ${tracking.providerStatus ?? "no status yet"}.`);
  });
}

export async function addTrackingEventAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return withAdmin("orders.trackingEvent", async () => {
    const parsed = z
      .object({ orderId: id, status: z.enum(["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "RETURN_REQUESTED", "RETURNED"]), note: z.string().trim().max(200).optional() })
      .safeParse(Object.fromEntries(formData));
    if (!parsed.success) return invalid(parsed.error);
    await addManualTrackingEvent(parsed.data.orderId, parsed.data.status, parsed.data.note || null);
    return done(parsed.data.orderId, "Tracking updated.");
  });
}

export async function saveAdminNoteAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return withAdmin("orders.note", async () => {
    const parsed = z
      .object({ orderId: id, adminNote: z.string().trim().max(2000), needsAttention: z.string().optional() })
      .safeParse(Object.fromEntries(formData));
    if (!parsed.success) return invalid(parsed.error);
    const { error } = await getAdminSupabase()
      .from("orders")
      .update({ admin_note: parsed.data.adminNote || null, needs_attention: parsed.data.needsAttention === "on" })
      .eq("id", parsed.data.orderId);
    if (error) throw error;
    return done(parsed.data.orderId, "Note saved.");
  });
}
