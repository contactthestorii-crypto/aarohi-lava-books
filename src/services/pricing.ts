// Pure pricing engine: no I/O, fully unit-tested (tests/unit/pricing.test.ts).
// All amounts are integer paise (docs/DECISIONS.md ADR-003). Callers must feed it values
// read from the database on the server, never values sent by the browser.

import type { PaymentMethod } from "@/types";

export interface PricingLine {
  productId: string;
  unitPricePaise: number;
  unitMrpPaise: number | null;
  quantity: number;
  categoryIds: string[];
}

export interface CouponRule {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  maxDiscountPaise: number | null;
  minOrderPaise: number;
  startsAt: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  perCustomerLimit: number | null;
  appliesTo: "all" | "products" | "categories";
  productIds: string[];
  categoryIds: string[];
  isActive: boolean;
}

export interface CouponUsage {
  total: number;
  byCustomer: number;
}

export interface PricingSettings {
  shipping: { flat_fee_paise: number; free_above_paise: number | null };
  cod: { enabled: boolean; fee_paise: number; max_order_paise: number | null };
  tax: { enabled: boolean; rate_bps: number; prices_include_tax: boolean };
}

export type CouponResult =
  | { ok: true; discountPaise: number }
  | { ok: false; message: string };

export interface Quote {
  subtotalPaise: number;
  mrpTotalPaise: number;
  /** Savings from MRP to selling price (display only; already inside subtotal). */
  mrpSavingsPaise: number;
  discountPaise: number;
  shippingPaise: number;
  codFeePaise: number;
  taxPaise: number;
  taxRateBps: number;
  pricesIncludeTax: boolean;
  totalPaise: number;
  itemCount: number;
  coupon: { id: string; code: string; discountPaise: number } | null;
  couponError: string | null;
  codAvailable: boolean;
  codUnavailableReason: string | null;
}

export function lineTotal(line: PricingLine): number {
  return line.unitPricePaise * line.quantity;
}

function eligibleSubtotal(coupon: CouponRule, lines: PricingLine[]): number {
  if (coupon.appliesTo === "all") return lines.reduce((sum, line) => sum + lineTotal(line), 0);
  if (coupon.appliesTo === "products") {
    const ids = new Set(coupon.productIds);
    return lines.filter((line) => ids.has(line.productId)).reduce((sum, line) => sum + lineTotal(line), 0);
  }
  const categoryIds = new Set(coupon.categoryIds);
  return lines
    .filter((line) => line.categoryIds.some((id) => categoryIds.has(id)))
    .reduce((sum, line) => sum + lineTotal(line), 0);
}

/** Validates a coupon against the cart and returns the discount it gives. */
export function evaluateCoupon(
  coupon: CouponRule | null,
  lines: PricingLine[],
  usage: CouponUsage,
  now: Date = new Date(),
): CouponResult {
  if (!coupon || !coupon.isActive) return { ok: false, message: "This coupon code is not valid." };
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return { ok: false, message: "This coupon is not active yet." };
  if (coupon.expiresAt && new Date(coupon.expiresAt) <= now) return { ok: false, message: "This coupon has expired." };
  if (coupon.maxUses !== null && usage.total >= coupon.maxUses) {
    return { ok: false, message: "This coupon has reached its usage limit." };
  }
  if (coupon.perCustomerLimit !== null && usage.byCustomer >= coupon.perCustomerLimit) {
    return { ok: false, message: "You have already used this coupon." };
  }

  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  if (subtotal < coupon.minOrderPaise) {
    return { ok: false, message: `Add items worth ${formatRupees(coupon.minOrderPaise - subtotal)} more to use this coupon.` };
  }

  const eligible = eligibleSubtotal(coupon, lines);
  if (eligible <= 0) return { ok: false, message: "This coupon does not apply to the books in your cart." };

  let discount = coupon.type === "percent" ? Math.floor((eligible * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscountPaise !== null) discount = Math.min(discount, coupon.maxDiscountPaise);
  discount = Math.min(discount, eligible);
  if (discount <= 0) return { ok: false, message: "This coupon does not reduce your total." };
  return { ok: true, discountPaise: discount };
}

function formatRupees(paise: number): string {
  const rupees = paise / 100;
  return `₹${Number.isInteger(rupees) ? rupees : rupees.toFixed(2)}`;
}

export interface QuoteInput {
  lines: PricingLine[];
  settings: PricingSettings;
  paymentMethod?: PaymentMethod;
  coupon?: CouponRule | null;
  couponUsage?: CouponUsage;
  now?: Date;
}

export function calculateQuote({
  lines,
  settings,
  paymentMethod = "online",
  coupon = null,
  couponUsage = { total: 0, byCustomer: 0 },
  now = new Date(),
}: QuoteInput): Quote {
  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const mrpTotal = lines.reduce((sum, line) => sum + (line.unitMrpPaise ?? line.unitPricePaise) * line.quantity, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  let discount = 0;
  let appliedCoupon: Quote["coupon"] = null;
  let couponError: string | null = null;
  if (coupon !== null) {
    const result = evaluateCoupon(coupon, lines, couponUsage, now);
    if (result.ok) {
      discount = result.discountPaise;
      appliedCoupon = { id: coupon.id, code: coupon.code, discountPaise: discount };
    } else {
      couponError = result.message;
    }
  }

  const goodsAfterDiscount = Math.max(subtotal - discount, 0);
  const freeShipping =
    settings.shipping.free_above_paise !== null && goodsAfterDiscount >= settings.shipping.free_above_paise;
  const shipping = lines.length === 0 || freeShipping ? 0 : settings.shipping.flat_fee_paise;

  const beforeCod = goodsAfterDiscount + shipping;
  let codAvailable = settings.cod.enabled && lines.length > 0;
  let codUnavailableReason: string | null = settings.cod.enabled ? null : "Cash on delivery is not available.";
  if (codAvailable && settings.cod.max_order_paise !== null && beforeCod > settings.cod.max_order_paise) {
    codAvailable = false;
    codUnavailableReason = `Cash on delivery is available for orders up to ${formatRupees(settings.cod.max_order_paise)}.`;
  }
  const codFee = paymentMethod === "cod" && codAvailable ? settings.cod.fee_paise : 0;

  // Tax applies to the goods value after discount. Inclusive prices: the tax is the portion
  // already contained in the price (shown, not added). Exclusive: added on top.
  const rate = settings.tax.enabled ? settings.tax.rate_bps : 0;
  let tax = 0;
  if (rate > 0) {
    tax = settings.tax.prices_include_tax
      ? Math.round(goodsAfterDiscount - (goodsAfterDiscount * 10000) / (10000 + rate))
      : Math.round((goodsAfterDiscount * rate) / 10000);
  }
  const addedTax = settings.tax.prices_include_tax ? 0 : tax;

  return {
    subtotalPaise: subtotal,
    mrpTotalPaise: mrpTotal,
    mrpSavingsPaise: Math.max(mrpTotal - subtotal, 0),
    discountPaise: discount,
    shippingPaise: shipping,
    codFeePaise: codFee,
    taxPaise: tax,
    taxRateBps: rate,
    pricesIncludeTax: settings.tax.prices_include_tax,
    totalPaise: Math.max(goodsAfterDiscount + shipping + codFee + addedTax, 0),
    itemCount,
    coupon: appliedCoupon,
    couponError,
    codAvailable,
    codUnavailableReason,
  };
}
