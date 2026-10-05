// file:///d:/New folder/src/services/orders.ts
import { supabase } from '@/lib/supabaseClient';

export const OrderStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PROCESSING: 'PROCESSING',
  PACKED: 'PACKED',
  SHIPPED: 'SHIPPED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  REFUNDED: 'REFUNDED',
  RETURN_REQUESTED: 'RETURN_REQUESTED',
  RETURNED: 'RETURNED',
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

/** Fetch all orders – used by the admin UI. */
export async function getOrders() {
  const { getAdminSupabase } = await import('@/lib/supabase/admin');
  const { data, error } = await getAdminSupabase().from('orders').select('*');
  if (error) throw error;
  return data;
}

/** Update an order's status. */
export async function setOrderStatus(
  orderId: string,
  status: string,
  note: string | null,
  actor: string,
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status, note, updated_by: actor })
    .eq('id', orderId);
  if (error) throw error;
}

/** Cancel an order – optionally restock items. */
export async function cancelOrder(
  orderId: string,
  reason: string,
  actor: string,
  restock: boolean = false,
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'CANCELLED', cancel_reason: reason, updated_by: actor })
    .eq('id', orderId);
  if (error) throw error;
  // Restocking logic can be added here if needed.
}

/** Record a refund for an order. */
export async function refundOrder(
  orderId: string,
  amountPaise: number,
  reason: string,
): Promise<void> {
  const { error } = await supabase.from('order_refunds').insert({
    order_id: orderId,
    amount_paise: amountPaise,
    reason,
  });
  if (error) throw error;
}

import type { OrderStatus as GlobalOrderStatus } from '@/types';

/** Manual status transition configuration – empty stub. */
export const MANUAL_TRANSITIONS: Record<string, GlobalOrderStatus[]> = {};

/** Expire pending (unpaid) orders – cancels them and returns count. */
export async function expirePendingOrders(): Promise<number> {
  const { data: pending, error } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'PENDING');
  if (error) throw error;
  if (!pending?.length) return 0;
  const ids = pending.map((o) => o.id);
  const { error: cancelErr } = await supabase
    .from('orders')
    .update({ status: 'CANCELLED' })
    .in('id', ids);
  if (cancelErr) throw cancelErr;
  return ids.length;
}

/** Record a failed payment – placeholder. */
export async function recordFailedPayment(
  provider: string,
  providerOrderId: string,
  providerPaymentId: string,
  code: string,
  description: string,
): Promise<void> {
  await supabase.from('payment_failures').insert({
    provider,
    provider_order_id: providerOrderId,
    provider_payment_id: providerPaymentId,
    code,
    description,
  });
}

/** Finalize online payment – marks order as paid. */
export async function finalizeOnlinePayment(payload: {
  orderId: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId: string;
  amountPaise: number;
  raw: any;
}): Promise<void> {
  const { orderId } = payload;
  const { error } = await supabase
    .from('orders')
    .update({ status: OrderStatus.PAID, payment_status: 'paid' })
    .eq('id', orderId);
  if (error) throw error;
}



/** Find internal order ID based on provider order ID. */
export async function findOrderIdByProviderOrder(
  provider: string,
  providerOrderId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('provider', provider)
    .eq('provider_order_id', providerOrderId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

/** Record a successful refund – placeholder. */
export async function recordRefund(orderId: string, amountPaise: number, reason: string): Promise<void> {
  await supabase.from('order_refunds').insert({ order_id: orderId, amount_paise: amountPaise, reason });
}

/** Hook after order confirmation – currently no side effects. */
export async function afterOrderConfirmed(orderId: string, eventName?: string): Promise<void> {
  // No action needed for now.
}
