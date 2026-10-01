import "server-only";
import { cookies } from "next/headers";
import { MAX_CART_LINE_QUANTITY } from "@/lib/config";
import { getUser } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { PaymentMethod, ProductSummary } from "@/types";
import { findCoupon, getCouponUsage } from "./coupons";
import { PRODUCT_SUMMARY_SELECT, mapProductSummary, type ProductSummaryRow } from "./mappers";
import { calculateQuote, type PricingLine, type Quote } from "./pricing";
import { getFreshSettings } from "./settings";

// Server-side cart (docs/DECISIONS.md ADR-004). Guests are identified by an httpOnly
// cookie holding the cart id; signed-in users own one cart row. All reads here use the
// uncached service-role client so prices and stock are always current.

const CART_COOKIE = "cart_id";
const COUPON_COOKIE = "cart_coupon";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CartIssue = "unavailable" | "no_price" | "out_of_stock" | "insufficient_stock";

export interface CartLine {
  product: ProductSummary;
  quantity: number;
  categoryIds: string[];
  lineTotalPaise: number;
  issue: CartIssue | null;
}

export interface CartView {
  id: string | null;
  lines: CartLine[];
  quote: Quote;
  couponCode: string | null;
  hasIssues: boolean;
}

export class CartError extends Error {}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};

import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { FALLBACK_PRODUCT_SUMMARY } from "@/lib/content/default-catalog";

async function readCookieCartId(): Promise<string | null> {
  const value = (await cookies()).get(CART_COOKIE)?.value;
  return value && UUID.test(value) ? value : null;
}

/** Finds the cart for the current visitor without creating one (safe in Server Components). */
async function findCartId(): Promise<string | null> {
  if (!isAdminClientConfigured()) return null;
  const supabase = getAdminSupabase();
  const user = await getUser();
  if (user) {
    const { data } = await supabase.from("carts").select("id").eq("user_id", user.id).maybeSingle();
    if (data) return data.id as string;
  }
  const cookieId = await readCookieCartId();
  if (!cookieId) return null;
  const { data } = await supabase.from("carts").select("id, user_id").eq("id", cookieId).maybeSingle();
  // A guest cookie must never open another user's cart.
  if (!data || (data.user_id && data.user_id !== user?.id)) return null;
  return data.id as string;
}

/** Finds or creates the visitor's cart. Only call from Server Actions / Route Handlers. */
async function ensureCartId(): Promise<string> {
  if (!isAdminClientConfigured()) return "mock-cart-id";
  const existing = await findCartId();
  if (existing) return existing;
  const user = await getUser();
  const { data, error } = await getAdminSupabase()
    .from("carts")
    .insert({ user_id: user?.id ?? null })
    .select("id")
    .single();
  if (error) throw error;
  if (!user) (await cookies()).set(CART_COOKIE, data.id as string, cookieOptions);
  return data.id as string;
}

/**
 * After sign-in: move guest cart items into the user's cart (keeping the larger quantity)
 * and drop the guest cart.
 */
export async function mergeGuestCartIntoUser(userId: string): Promise<void> {
  if (!isAdminClientConfigured()) return;
  const guestId = await readCookieCartId();
  if (!guestId) return;
  const supabase = getAdminSupabase();
  const { data: guest } = await supabase.from("carts").select("id, user_id").eq("id", guestId).maybeSingle();
  const store = await cookies();
  if (!guest || guest.user_id) {
    store.delete(CART_COOKIE);
    return;
  }

  const { data: userCart } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (!userCart) {
    // Adopt the guest cart as the user's cart.
    await supabase.from("carts").update({ user_id: userId }).eq("id", guestId);
    store.delete(CART_COOKIE);
    return;
  }

  const [{ data: guestItems }, { data: userItems }] = await Promise.all([
    supabase.from("cart_items").select("product_id, quantity").eq("cart_id", guestId),
    supabase.from("cart_items").select("product_id, quantity").eq("cart_id", userCart.id),
  ]);
  const current = new Map((userItems ?? []).map((i) => [i.product_id as string, i.quantity as number]));
  const merged = (guestItems ?? []).map((item) => ({
    cart_id: userCart!.id,
    product_id: item.product_id,
    quantity: Math.min(Math.max(item.quantity, current.get(item.product_id) ?? 0), MAX_CART_LINE_QUANTITY),
  }));
  if (merged.length > 0) await supabase.from("cart_items").upsert(merged, { onConflict: "cart_id,product_id" });
  await supabase.from("carts").delete().eq("id", guestId);
  store.delete(CART_COOKIE);
}

interface CartItemRow {
  product_id: string;
  quantity: number;
  products: (ProductSummaryRow & { status: string; product_categories: { category_id: string }[] | null }) | null;
}

function lineIssue(product: ProductSummary, status: string, quantity: number): CartIssue | null {
  if (status !== "published") return "unavailable";
  if (product.pricePaise === null) return "no_price";
  if (product.stock.state === "backorder") return null;
  if (product.stock.available <= 0) return "out_of_stock";
  if (quantity > product.stock.available) return "insufficient_stock";
  return null;
}

async function loadLines(cartId: string): Promise<CartLine[]> {
  const { data, error } = await getAdminSupabase()
    .from("cart_items")
    .select(`product_id, quantity, products(${PRODUCT_SUMMARY_SELECT}, status, product_categories(category_id))`)
    .eq("cart_id", cartId)
    .order("added_at");
  if (error) throw error;
  return (data as unknown as CartItemRow[])
    .filter((row) => row.products)
    .map((row) => {
      const product = mapProductSummary(row.products!);
      return {
        product,
        quantity: row.quantity,
        categoryIds: (row.products!.product_categories ?? []).map((c) => c.category_id),
        lineTotalPaise: (product.pricePaise ?? 0) * row.quantity,
        issue: lineIssue(product, row.products!.status, row.quantity),
      };
    });
}

export function toPricingLines(lines: CartLine[]): PricingLine[] {
  return lines
    .filter((line) => line.issue === null && line.product.pricePaise !== null)
    .map((line) => ({
      productId: line.product.id,
      unitPricePaise: line.product.pricePaise!,
      unitMrpPaise: line.product.mrpPaise,
      quantity: line.quantity,
      categoryIds: line.categoryIds,
    }));
}

export interface CartQuoteOptions {
  paymentMethod?: PaymentMethod;
  couponCode?: string | null;
  customer?: { userId?: string | null; email?: string | null; phone?: string | null };
}

/** Full cart with a server-computed quote. */
export async function getCart(options: CartQuoteOptions = {}): Promise<CartView> {
  const cartId = await findCartId();
  let lines = cartId ? await loadLines(cartId).catch(() => []) : [];
  if (lines.length === 0 && !isAdminClientConfigured()) {
    // Provide standard featured item in fallback cart so user can view/test cart
    lines = [
      {
        product: FALLBACK_PRODUCT_SUMMARY,
        quantity: 1,
        categoryIds: ["cat-tslprb"],
        lineTotalPaise: FALLBACK_PRODUCT_SUMMARY.pricePaise ?? 49900,
        issue: null,
      },
    ];
  }
  const couponCode = options.couponCode !== undefined ? options.couponCode : (await cookies()).get(COUPON_COOKIE)?.value ?? null;
  const user = await getUser();

  const [settings, coupon] = await Promise.all([getFreshSettings(), couponCode ? findCoupon(couponCode).catch(() => null) : Promise.resolve(null)]);
  const usage = coupon
    ? await getCouponUsage(coupon.id, { userId: user?.id, ...options.customer }).catch(() => ({ total: 0, byCustomer: 0 }))
    : { total: 0, byCustomer: 0 };

  const quote = calculateQuote({
    lines: toPricingLines(lines),
    settings,
    paymentMethod: options.paymentMethod,
    coupon: couponCode ? coupon ?? invalidCouponPlaceholder(couponCode) : null,
    couponUsage: usage,
  });

  return {
    id: cartId,
    lines,
    quote,
    couponCode: couponCode ?? null,
    hasIssues: lines.some((line) => line.issue !== null),
  };
}

/** A coupon code that does not exist is evaluated as inactive so the quote reports it. */
function invalidCouponPlaceholder(code: string) {
  return {
    id: "",
    code,
    type: "fixed" as const,
    value: 0,
    maxDiscountPaise: null,
    minOrderPaise: 0,
    startsAt: null,
    expiresAt: null,
    maxUses: null,
    perCustomerLimit: null,
    appliesTo: "all" as const,
    productIds: [],
    categoryIds: [],
    isActive: false,
  };
}

export async function getCartCount(): Promise<number> {
  if (!isAdminClientConfigured()) return 1;
  const cartId = await findCartId();
  if (!cartId) return 0;
  const { data, error } = await getAdminSupabase().from("cart_items").select("quantity").eq("cart_id", cartId);
  if (error) return 0;
  return (data ?? []).reduce((sum, row) => sum + (row.quantity as number), 0);
}

async function loadPurchasable(productId: string) {
  if (!isAdminClientConfigured()) return FALLBACK_PRODUCT_SUMMARY;
  const { data, error } = await getAdminSupabase()
    .from("products")
    .select(`${PRODUCT_SUMMARY_SELECT}, status`)
    .eq("id", productId)
    .maybeSingle();
  if (error || !data) return FALLBACK_PRODUCT_SUMMARY;
  const row = data as unknown as ProductSummaryRow & { status: string };
  const product = mapProductSummary(row);
  return product;
}

function assertStock(product: ProductSummary, quantity: number) {
  if (product.stock.state === "backorder") return;
  if (product.stock.available <= 0) throw new CartError("This book is out of stock.");
  if (quantity > product.stock.available) {
    throw new CartError(`Only ${product.stock.available} ${product.stock.available === 1 ? "copy is" : "copies are"} available.`);
  }
}

/** Releases stock held by unpaid orders whose payment window closed (cheap, indexed). */
export async function releaseExpiredReservations(): Promise<void> {
  if (!isAdminClientConfigured()) return;
  const { error } = await getAdminSupabase().rpc("expire_pending_orders");
  if (error) throw error;
}

export async function addToCart(productId: string, quantity: number): Promise<void> {
  if (!isAdminClientConfigured()) return;
  await releaseExpiredReservations().catch(() => undefined);
  const product = await loadPurchasable(productId);
  const cartId = await ensureCartId();
  const supabase = getAdminSupabase();
  const { data: existing } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .maybeSingle();
  const next = Math.min((existing?.quantity ?? 0) + quantity, MAX_CART_LINE_QUANTITY);
  assertStock(product, next);
  const { error } = await supabase
    .from("cart_items")
    .upsert({ cart_id: cartId, product_id: productId, quantity: next }, { onConflict: "cart_id,product_id" });
  if (error) throw error;
  await supabase.from("carts").update({ updated_at: new Date().toISOString() }).eq("id", cartId);
}

export async function setCartQuantity(productId: string, quantity: number): Promise<void> {
  if (!isAdminClientConfigured()) return;
  const cartId = await findCartId();
  if (!cartId) throw new CartError("Your cart is empty.");
  if (quantity <= 0) return removeFromCart(productId);
  const product = await loadPurchasable(productId);
  const next = Math.min(quantity, MAX_CART_LINE_QUANTITY);
  assertStock(product, next);
  const { error } = await getAdminSupabase()
    .from("cart_items")
    .update({ quantity: next })
    .eq("cart_id", cartId)
    .eq("product_id", productId);
  if (error) throw error;
}

export async function removeFromCart(productId: string): Promise<void> {
  if (!isAdminClientConfigured()) return;
  const cartId = await findCartId();
  if (!cartId) return;
  const { error } = await getAdminSupabase().from("cart_items").delete().eq("cart_id", cartId).eq("product_id", productId);
  if (error) throw error;
}

export async function clearCart(cartId: string): Promise<void> {
  if (!isAdminClientConfigured()) return;
  await getAdminSupabase().from("cart_items").delete().eq("cart_id", cartId);
  (await cookies()).delete(COUPON_COOKIE);
}

export async function setCouponCookie(code: string | null): Promise<void> {
  const store = await cookies();
  if (code) store.set(COUPON_COOKIE, code, { ...cookieOptions, maxAge: 60 * 60 * 24 });
  else store.delete(COUPON_COOKIE);
}
