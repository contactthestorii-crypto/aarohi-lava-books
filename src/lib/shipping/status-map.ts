import type { OrderStatus } from "@/types";

// Maps provider-specific shipment statuses to internal order statuses. Unknown statuses
// map to null: they are stored as tracking events but never change the order status.

const SHIPROCKET: Record<string, OrderStatus> = {
  NEW: "PACKED",
  "AWB ASSIGNED": "PACKED",
  "LABEL GENERATED": "PACKED",
  "PICKUP SCHEDULED": "PACKED",
  "PICKUP GENERATED": "PACKED",
  "PICKUP QUEUED": "PACKED",
  "MANIFEST GENERATED": "PACKED",
  "OUT FOR PICKUP": "PACKED",
  "PICKED UP": "SHIPPED",
  SHIPPED: "SHIPPED",
  "IN TRANSIT": "SHIPPED",
  "IN TRANSIT AT DESTINATION HUB": "SHIPPED",
  "REACHED AT DESTINATION HUB": "SHIPPED",
  "REACHED DESTINATION HUB": "SHIPPED",
  DELAYED: "SHIPPED",
  MISROUTED: "SHIPPED",
  "OUT FOR DELIVERY": "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  "RTO INITIATED": "RETURN_REQUESTED",
  "RTO IN TRANSIT": "RETURN_REQUESTED",
  "RTO OFD": "RETURN_REQUESTED",
  "RTO DELIVERED": "RETURNED",
};

export function normaliseProviderStatus(status: string): string {
  return status
    .toUpperCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function mapShiprocketStatus(status: string | null | undefined): OrderStatus | null {
  if (!status) return null;
  return SHIPROCKET[normaliseProviderStatus(status)] ?? null;
}

/** Order of fulfilment progress; used so late or duplicate events never move an order back. */
const PROGRESS: Partial<Record<OrderStatus, number>> = {
  PAID: 1,
  PROCESSING: 2,
  PACKED: 3,
  SHIPPED: 4,
  OUT_FOR_DELIVERY: 5,
  DELIVERED: 6,
  RETURN_REQUESTED: 7,
  RETURNED: 8,
};

/** True when a shipping update to `next` should replace the order's `current` status. */
export function shouldAdvanceStatus(current: OrderStatus, next: OrderStatus | null): boolean {
  if (!next || current === next) return false;
  if (current === "CANCELLED" || current === "REFUNDED" || current === "PENDING_PAYMENT") return false;
  const from = PROGRESS[current];
  const to = PROGRESS[next];
  if (from === undefined || to === undefined) return false;
  return to > from;
}
