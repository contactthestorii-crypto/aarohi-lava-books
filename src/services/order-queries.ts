import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderStatus, PaymentMethod, PaymentStatus, ShippingAddress } from "@/types";

// Read models for orders, shared by the account area (user session, RLS), order tracking
// and the admin (service role). Callers choose the client; RLS decides visibility.

export interface OrderItemView {
  id: string;
  productId: string | null;
  title: string;
  slug: string | null;
  coverUrl: string | null;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
}

export interface OrderEventView {
  id: number;
  status: OrderStatus | null;
  message: string | null;
  actor: string;
  createdAt: string;
}

export interface ShipmentView {
  id: string;
  provider: string;
  awb: string | null;
  courierName: string | null;
  trackingUrl: string | null;
  status: OrderStatus | null;
  providerStatus: string | null;
  estimatedDelivery: string | null;
  labelUrl: string | null;
  providerOrderId: string | null;
  providerShipmentId: string | null;
  lastSyncedAt: string | null;
  isActive: boolean;
  events: { id: number; providerStatus: string; location: string | null; description: string | null; occurredAt: string }[];
}

export interface PaymentView {
  id: string;
  provider: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amountPaise: number;
  refundedPaise: number;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  errorDescription: string | null;
  createdAt: string;
}

export interface OrderSummaryView {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalPaise: number;
  itemCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  needsAttention: boolean;
  createdAt: string;
}

export interface OrderDetailView extends OrderSummaryView {
  accessToken: string;
  userId: string | null;
  shippingAddress: ShippingAddress;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  codFeePaise: number;
  taxPaise: number;
  taxRateBps: number;
  pricesIncludeTax: boolean;
  couponCode: string | null;
  customerNote: string | null;
  adminNote: string | null;
  cancelReason: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  items: OrderItemView[];
  events: OrderEventView[];
  shipments: ShipmentView[];
  payments: PaymentView[];
}

const SUMMARY_COLUMNS =
  "id, order_number, status, payment_method, payment_status, total_paise, customer_name, customer_email, customer_phone, needs_attention, created_at, order_items(quantity)";

const DETAIL_COLUMNS = `id, order_number, access_token, user_id, status, payment_method, payment_status, total_paise, customer_name, customer_email, customer_phone, needs_attention, created_at,
  shipping_address, subtotal_paise, discount_paise, shipping_paise, cod_fee_paise, tax_paise, tax_rate_bps, prices_include_tax, coupon_code, customer_note, admin_note, cancel_reason, expires_at, paid_at,
  order_items(id, product_id, title, slug, cover_url, unit_price_paise, quantity, line_total_paise),
  order_events(id, status, message, actor, created_at),
  shipments(id, provider, awb, courier_name, tracking_url, status, provider_status, estimated_delivery, label_url, provider_order_id, provider_shipment_id, last_synced_at, is_active, created_at,
    shipping_events(id, provider_status, location, description, occurred_at)),
  payments(id, provider, method, status, amount_paise, refunded_paise, provider_order_id, provider_payment_id, error_description, created_at)`;

/* eslint-disable @typescript-eslint/no-explicit-any -- PostgREST rows are mapped field by field below. */
function mapSummary(row: any): OrderSummaryView {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    totalPaise: row.total_paise,
    itemCount: (row.order_items ?? []).reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    needsAttention: row.needs_attention,
    createdAt: row.created_at,
  };
}

function mapDetail(row: any): OrderDetailView {
  const address = row.shipping_address ?? {};
  return {
    ...mapSummary(row),
    accessToken: row.access_token,
    userId: row.user_id,
    shippingAddress: {
      fullName: address.fullName ?? row.customer_name,
      phone: address.phone ?? row.customer_phone,
      line1: address.line1 ?? "",
      line2: address.line2 ?? null,
      area: address.area ?? null,
      city: address.city ?? "",
      state: address.state ?? "",
      pincode: address.pincode ?? "",
      landmark: address.landmark ?? null,
    },
    subtotalPaise: row.subtotal_paise,
    discountPaise: row.discount_paise,
    shippingPaise: row.shipping_paise,
    codFeePaise: row.cod_fee_paise,
    taxPaise: row.tax_paise,
    taxRateBps: row.tax_rate_bps,
    pricesIncludeTax: row.prices_include_tax,
    couponCode: row.coupon_code,
    customerNote: row.customer_note,
    adminNote: row.admin_note,
    cancelReason: row.cancel_reason,
    expiresAt: row.expires_at,
    paidAt: row.paid_at,
    items: (row.order_items ?? []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      title: item.title,
      slug: item.slug,
      coverUrl: item.cover_url,
      unitPricePaise: item.unit_price_paise,
      quantity: item.quantity,
      lineTotalPaise: item.line_total_paise,
    })),
    events: (row.order_events ?? [])
      .map((event: any) => ({ id: event.id, status: event.status, message: event.message, actor: event.actor, createdAt: event.created_at }))
      .sort((a: OrderEventView, b: OrderEventView) => a.id - b.id),
    shipments: (row.shipments ?? [])
      .map((s: any) => ({
        id: s.id,
        provider: s.provider,
        awb: s.awb,
        courierName: s.courier_name,
        trackingUrl: s.tracking_url,
        status: s.status,
        providerStatus: s.provider_status,
        estimatedDelivery: s.estimated_delivery,
        labelUrl: s.label_url,
        providerOrderId: s.provider_order_id,
        providerShipmentId: s.provider_shipment_id,
        lastSyncedAt: s.last_synced_at,
        isActive: s.is_active,
        events: (s.shipping_events ?? [])
          .map((e: any) => ({ id: e.id, providerStatus: e.provider_status, location: e.location, description: e.description, occurredAt: e.occurred_at }))
          .sort((a: { occurredAt: string }, b: { occurredAt: string }) => b.occurredAt.localeCompare(a.occurredAt)),
      }))
      .sort((a: ShipmentView, b: ShipmentView) => Number(b.isActive) - Number(a.isActive)),
    payments: (row.payments ?? []).map((p: any) => ({
      id: p.id,
      provider: p.provider,
      method: p.method,
      status: p.status,
      amountPaise: p.amount_paise,
      refundedPaise: p.refunded_paise,
      providerOrderId: p.provider_order_id,
      providerPaymentId: p.provider_payment_id,
      errorDescription: p.error_description,
      createdAt: p.created_at,
    })),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function listOrdersForUser(client: SupabaseClient, userId: string): Promise<OrderSummaryView[]> {
  const { data, error } = await client
    .from("orders")
    .select(SUMMARY_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map(mapSummary);
}

/** Loads one order by id. With a user-session client, RLS returns null for other users' orders. */
export async function getOrderById(client: SupabaseClient, id: string): Promise<OrderDetailView | null> {
  const { data, error } = await client.from("orders").select(DETAIL_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapDetail(data) : null;
}

export async function getOrderByNumber(client: SupabaseClient, orderNumber: string): Promise<OrderDetailView | null> {
  const { data, error } = await client.from("orders").select(DETAIL_COLUMNS).eq("order_number", orderNumber).maybeSingle();
  if (error) throw error;
  return data ? mapDetail(data) : null;
}

export interface AdminOrderFilters {
  status?: OrderStatus | "attention";
  q?: string;
  page?: number;
  pageSize?: number;
}

export async function listOrdersForAdmin(client: SupabaseClient, filters: AdminOrderFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 25;
  let query = client.from("orders").select(SUMMARY_COLUMNS, { count: "exact" });
  if (filters.status === "attention") query = query.eq("needs_attention", true);
  else if (filters.status) query = query.eq("status", filters.status);
  const q = filters.q?.trim().replace(/[,()"\\]/g, "");
  if (q) {
    query = query.or(`order_number.ilike.%${q}%,customer_email.ilike.%${q}%,customer_phone.ilike.%${q}%,customer_name.ilike.%${q}%`);
  }
  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error) throw error;
  const total = count ?? 0;
  return { items: (data ?? []).map(mapSummary), total, page, totalPages: Math.ceil(total / pageSize) };
}
