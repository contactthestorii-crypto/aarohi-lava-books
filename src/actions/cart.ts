"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failure, type ActionResult } from "@/lib/action-result";
import { MAX_CART_LINE_QUANTITY } from "@/lib/config";
import { checkRateLimit, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";
import { addToCart, CartError, getCart, removeFromCart, setCartQuantity, setCouponCookie } from "@/services/cart";
import { normaliseCouponCode } from "@/services/coupons";

const productIdSchema = z.uuid();
const quantitySchema = z.coerce.number().int().min(0).max(MAX_CART_LINE_QUANTITY);

const NOT_READY = "The store is not accepting orders yet. Please try again later.";

async function run(scope: string, fn: () => Promise<ActionResult>): Promise<ActionResult> {
  if (!isAdminClientConfigured()) return failure(NOT_READY);
  try {
    return await fn();
  } catch (error) {
    if (error instanceof CartError) return failure(error.message);
    log.error(scope, error);
    return failure("Something went wrong updating your cart. Please try again.");
  }
}

export async function addToCartAction(productId: string, quantity = 1): Promise<ActionResult> {
  return run("cart.add", async () => {
    const id = productIdSchema.safeParse(productId);
    const qty = quantitySchema.safeParse(quantity);
    if (!id.success || !qty.success || qty.data < 1) return failure("Invalid item.");
    await addToCart(id.data, qty.data);
    revalidatePath("/cart");
    return { ok: true, message: "Added to cart" };
  });
}

export async function updateCartQuantityAction(productId: string, quantity: number): Promise<ActionResult> {
  return run("cart.update", async () => {
    const id = productIdSchema.safeParse(productId);
    const qty = quantitySchema.safeParse(quantity);
    if (!id.success || !qty.success) return failure("Invalid quantity.");
    await setCartQuantity(id.data, qty.data);
    revalidatePath("/cart");
    return { ok: true };
  });
}

export async function removeFromCartAction(productId: string): Promise<ActionResult> {
  return run("cart.remove", async () => {
    const id = productIdSchema.safeParse(productId);
    if (!id.success) return failure("Invalid item.");
    await removeFromCart(id.data);
    revalidatePath("/cart");
    return { ok: true, message: "Removed from cart" };
  });
}

export async function applyCouponAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return run("cart.coupon", async () => {
    const code = normaliseCouponCode(String(formData.get("code") ?? ""));
    if (!code) return failure("Enter a coupon code.");
    if (!(await checkRateLimit("coupon"))) return failure(RATE_LIMITED_MESSAGE);
    const cart = await getCart({ couponCode: code });
    if (cart.quote.couponError || !cart.quote.coupon) return failure(cart.quote.couponError ?? "This coupon code is not valid.");
    await setCouponCookie(code);
    revalidatePath("/cart");
    revalidatePath("/checkout");
    return { ok: true, message: `Coupon ${code} applied.` };
  });
}

export async function removeCouponAction(): Promise<ActionResult> {
  return run("cart.coupon.remove", async () => {
    await setCouponCookie(null);
    revalidatePath("/cart");
    revalidatePath("/checkout");
    return { ok: true };
  });
}
