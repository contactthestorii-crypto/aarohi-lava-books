import type { OrderStatus, PaymentMethod, ShippingAddress } from "@/types";

// Provider-neutral shipping contracts (docs/DECISIONS.md ADR-006). Business logic in
// src/services/shipping.ts only talks to these types.

export interface ServiceabilityResult {
  /** true / false when the provider answered; null when the provider cannot check (manual). */
  serviceable: boolean | null;
  codAvailable: boolean | null;
  estimatedDays: number | null;
  courierName: string | null;
}

export interface ShipmentRequest {
  orderNumber: string;
  orderDate: Date;
  customer: { name: string; email: string; phone: string };
  address: ShippingAddress;
  items: { name: string; sku: string; units: number; unitPricePaise: number }[];
  paymentMethod: PaymentMethod;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  totalPaise: number;
  weightGrams: number;
  dimensionsCm: { length: number; breadth: number; height: number };
}

export interface ShipmentResult {
  providerOrderId: string | null;
  providerShipmentId: string | null;
  awb: string | null;
  courierName: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
  providerStatus: string | null;
}

export interface TrackingEvent {
  providerStatus: string;
  status: OrderStatus | null;
  location: string | null;
  description: string | null;
  occurredAt: string;
}

export interface TrackingResult {
  providerStatus: string | null;
  status: OrderStatus | null;
  courierName: string | null;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
  events: TrackingEvent[];
}

export interface ShippingProvider {
  readonly name: string;
  /** Can this provider create shipments / fetch tracking automatically? */
  readonly automated: boolean;
  isConfigured(): boolean;
  checkServiceability(pincode: string, options: { weightGrams: number; cod: boolean }): Promise<ServiceabilityResult>;
  createShipment(request: ShipmentRequest): Promise<ShipmentResult>;
  track(awb: string): Promise<TrackingResult>;
  cancel(providerOrderId: string): Promise<void>;
}

export class ShippingProviderError extends Error {
  constructor(
    message: string,
    readonly userMessage = "The shipping service is unavailable right now. Please try again shortly.",
  ) {
    super(message);
    this.name = "ShippingProviderError";
  }
}
