import "server-only";
import { ORDER_PAYMENT_WINDOW_MINUTES } from "@/lib/config";
import { getUser } from "@/lib/auth";
import { getPaymentProvider, PaymentError, type ClientCheckout } from "@/lib/payments";
import { getShippingProvider } from "@/lib/shipping";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { log } from "@/lib/utils/log";
import type { AddressInput } from "@/lib/validation/common";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation/checkout";
import { clearCart, getCart, releaseExpiredReservations, type CartView } from "./cart";
import { afterOrderConfirmed, cancelOrder } from "./orders";
import { getFreshSettings } from "./settings";

export class CheckoutError extends Error {
  constructor(
    readonly userMessage: string,
    readonly code: string = "CHECKOUT_ERROR",
  ) {
    super(userMessage);
  }
}

export interface PlacedOrder {
  orderId: string;
  orderNumber: string;
  accessToken: string;
  status: string;
  totalPaise: number;
  payment: ClientCheckout | null;
}

const RPC_ERRORS: [RegExp, string][] = [
  [/INSUFFICIENT_STOCK/, "One of the books just went out of stock. Please review your cart."],
  [/PRICE_CHANGED/, "A price in your cart has just changed. Please review the updated total."],
  [/PRODUCT_UNAVAILABLE/, "One of the books is no longer available. Please review your cart."],
  [/EMPTY_CART/, "Your cart is empty."],
];

function assertCartReady(cart: CartView) {
  if (cart.lines.length === 0) throw new CheckoutError("Your cart is empty.", "EMPTY_CART");
  if (cart.hasIssues) throw new CheckoutError("Some items in your cart need attention. Please review your cart.", "CART_ISSUES");
}

/** Creates the order (reserving stock) and, for online payment, the gateway order. */
export async function placeOrder(raw: CheckoutInput): Promise<PlacedOrder> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) throw new CheckoutError("Please check your details and try again.", "INVALID_INPUT");
  const input = parsed.data;

  await releaseExpiredReservations().catch((error) => log.warn("checkout.expire", String(error)));
  const [user, settings] = await Promise.all([getUser(), getFreshSettings()]);
  if (!user && !settings.checkout.allow_guest) throw new CheckoutError("Please sign in to place an order.", "LOGIN_REQUIRED");

  const cart = await getCart({
    paymentMethod: input.paymentMethod,
    couponCode: input.couponCode ?? undefined,
    customer: { userId: user?.id, email: input.contact.email, phone: input.contact.phone },
  });
  assertCartReady(cart);
  const { quote } = cart;
  if (input.couponCode && quote.couponError) throw new CheckoutError(quote.couponError, "COUPON");
  if (input.paymentMethod === "cod" && !quote.codAvailable) {
    throw new CheckoutError(quote.codUnavailableReason ?? "Cash on delivery is not available for this order.", "COD_UNAVAILABLE");
  }

  // Ask the courier partner (when automated) whether we can deliver to this pincode.
  const shipping = getShippingProvider();
  if (shipping.automated) {
    try {
      const serviceability = await shipping.checkServiceability(input.address.pincode, {
        weightGrams: settings.shipping.default_book_weight_grams * quote.itemCount,
        cod: input.paymentMethod === "cod",
      });
      if (serviceability.serviceable === false) {
        throw new CheckoutError(`Sorry, we cannot deliver to ${input.address.pincode} yet.`, "NOT_SERVICEABLE");
      }
      if (input.paymentMethod === "cod" && serviceability.codAvailable === false) {
        throw new CheckoutError("Cash on delivery is not available for this pincode. Please pay online.", "COD_UNAVAILABLE");
      }
    } catch (error) {
      if (error instanceof CheckoutError) throw error;
      // Courier API down: do not block the sale; staff confirm delivery when packing.
      log.warn("checkout.serviceability", String(error), { pincode: input.address.pincode });
    }
  }

  const provider = input.paymentMethod === "online" ? getPaymentProvider() : null;
  if (provider && !provider.isConfigured()) throw new CheckoutError("Online payment is not available right now. Please try again later.", "PAYMENTS_OFF");

  const coverByProduct = new Map(cart.lines.map((line) => [line.product.id, line.product.cover?.url ?? null]));
  const { data, error } = await getAdminSupabase().rpc("place_order", {
    p_order: {
      idempotency_key: input.idempotencyKey,
      user_id: user?.id ?? null,
      payment_method: input.paymentMethod,
      payment_provider: provider?.name ?? "cod",
      customer_name: input.contact.fullName,
      customer_email: input.contact.email,
      customer_phone: input.contact.phone,
      shipping_address: input.address,
      shipping_pincode: input.address.pincode,
      shipping_method: input.shippingMethod,
      subtotal_paise: quote.subtotalPaise,
      discount_paise: quote.discountPaise,
      shipping_paise: quote.shippingPaise,
      cod_fee_paise: quote.codFeePaise,
      tax_paise: quote.taxPaise,
      total_paise: quote.totalPaise,
      tax_rate_bps: quote.taxRateBps,
      prices_include_tax: quote.pricesIncludeTax,
      coupon_id: quote.coupon?.id ?? null,
      coupon_code: quote.coupon?.code ?? null,
      customer_note: input.customerNote,
      payment_window_minutes: ORDER_PAYMENT_WINDOW_MINUTES,
    },
    p_items: cart.lines.map((line) => ({
      product_id: line.product.id,
      quantity: line.quantity,
      unit_price_paise: line.product.pricePaise,
      cover_url: coverByProduct.get(line.product.id),
    })),
  });
  if (error) {
    const match = RPC_ERRORS.find(([pattern]) => pattern.test(error.message));
    if (match) throw new CheckoutError(match[1], "CART_CHANGED");
    log.error("checkout.placeOrder", error);
    throw new CheckoutError("We could not place your order. You have not been charged. Please try again.");
  }
  const order = data as { id: string; order_number: string; access_token: string; status: string; total_paise: number; created: boolean };

  if (user && input.saveAddress) await saveAddressForUser(input.address).catch((e) => log.warn("checkout.saveAddress", String(e)));

  if (input.paymentMethod === "cod") {
    if (cart.id) await clearCart(cart.id);
    if (order.created) await afterOrderConfirmed(order.id, "order_placed");
    return { orderId: order.id, orderNumber: order.order_number, accessToken: order.access_token, status: order.status, totalPaise: order.total_paise, payment: null };
  }

  const payment = await openGatewayPayment(order.id);
  return { orderId: order.id, orderNumber: order.order_number, accessToken: order.access_token, status: order.status, totalPaise: order.total_paise, payment };
}

/**
 * Returns gateway checkout details for a pending online order: reuses the existing gateway
 * order (retries are allowed on the same Razorpay order) or creates one.
 */
export async function openGatewayPayment(orderId: string): Promise<ClientCheckout> {
  const supabase = getAdminSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, status, total_paise, customer_name, customer_email, customer_phone, expires_at")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.status !== "PENDING_PAYMENT") throw new CheckoutError("This order is not awaiting payment.", "NOT_PENDING");
  if (order.expires_at && new Date(order.expires_at as string) < new Date()) {
    throw new CheckoutError("The payment window for this order has closed. Please place a new order.", "EXPIRED");
  }

  const provider = getPaymentProvider();
  const { data: existing } = await supabase
    .from("payments")
    .select("provider, provider_order_id")
    .eq("order_id", orderId)
    .eq("method", "online")
    .not("provider_order_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const customer = { name: order.customer_name as string, email: order.customer_email as string, phone: order.customer_phone as string };
  const paymentInput = { orderId, orderNumber: order.order_number as string, amountPaise: order.total_paise as number, customer };
  if (existing?.provider === provider.name && existing.provider_order_id) {
    // Retry on the same gateway order so every attempt is linked to this order.
    return provider.checkoutFor(existing.provider_order_id as string, paymentInput);
  }

  try {
    const created = await provider.createPayment(paymentInput);
    const { error } = await supabase.rpc("attach_provider_order", {
      p_order_id: orderId,
      p_provider: provider.name,
      p_provider_order_id: created.providerOrderId,
    });
    if (error) throw error;
    return created.checkout;
  } catch (error) {
    log.error("checkout.gateway", error, { orderId });
    await cancelOrder(orderId, "Payment could not be started", "system", false).catch(() => undefined);
    throw new CheckoutError(
      error instanceof PaymentError ? error.userMessage : "Online payment could not be started. You have not been charged. Please try again.",
      "GATEWAY",
    );
  }
}

async function saveAddressForUser(address: AddressInput) {
  const supabase = await createServerSupabase();
  const user = await getUser();
  if (!user) return;
  const { data: existing } = await supabase
    .from("addresses")
    .select("id")
    .eq("line1", address.line1)
    .eq("pincode", address.pincode)
    .limit(1);
  if ((existing ?? []).length > 0) return;
  const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true });
  await supabase.from("addresses").insert({
    user_id: user.id,
    full_name: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 || null,
    area: address.area || null,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    landmark: address.landmark || null,
    is_default: (count ?? 0) === 0,
  });
}
