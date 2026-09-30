import { describe, expect, it } from "vitest";
import { calculateQuote, evaluateCoupon, type CouponRule, type PricingLine, type PricingSettings } from "@/services/pricing";

const settings: PricingSettings = {
  shipping: { flat_fee_paise: 5000, free_above_paise: 100000 },
  cod: { enabled: true, fee_paise: 2000, max_order_paise: 300000 },
  tax: { enabled: false, rate_bps: 0, prices_include_tax: true },
};

const book = (overrides: Partial<PricingLine> = {}): PricingLine => ({
  productId: "p1",
  unitPricePaise: 45000,
  unitMrpPaise: 50000,
  quantity: 1,
  categoryIds: ["c-gs"],
  ...overrides,
});

const coupon = (overrides: Partial<CouponRule> = {}): CouponRule => ({
  id: "k1",
  code: "SAVE10",
  type: "percent",
  value: 10,
  maxDiscountPaise: null,
  minOrderPaise: 0,
  startsAt: null,
  expiresAt: null,
  maxUses: null,
  perCustomerLimit: null,
  appliesTo: "all",
  productIds: [],
  categoryIds: [],
  isActive: true,
  ...overrides,
});

const noUsage = { total: 0, byCustomer: 0 };
const now = new Date("2026-09-30T10:00:00Z");

describe("calculateQuote", () => {
  it("sums lines and adds flat shipping below the free threshold", () => {
    const quote = calculateQuote({ lines: [book({ quantity: 2 })], settings });
    expect(quote.subtotalPaise).toBe(90000);
    expect(quote.mrpSavingsPaise).toBe(10000);
    expect(quote.shippingPaise).toBe(5000);
    expect(quote.totalPaise).toBe(95000);
    expect(quote.itemCount).toBe(2);
  });

  it("gives free shipping at or above the threshold (after discount)", () => {
    expect(calculateQuote({ lines: [book({ unitPricePaise: 100000, unitMrpPaise: null })], settings }).shippingPaise).toBe(0);
    const discounted = calculateQuote({
      lines: [book({ unitPricePaise: 100000, unitMrpPaise: null })],
      settings,
      coupon: coupon(),
      now,
    });
    expect(discounted.discountPaise).toBe(10000);
    expect(discounted.shippingPaise).toBe(5000);
  });

  it("charges no shipping for an empty cart", () => {
    expect(calculateQuote({ lines: [], settings }).totalPaise).toBe(0);
  });

  it("adds the COD fee only for COD payments and respects the COD limit", () => {
    expect(calculateQuote({ lines: [book()], settings, paymentMethod: "cod" }).codFeePaise).toBe(2000);
    expect(calculateQuote({ lines: [book()], settings, paymentMethod: "online" }).codFeePaise).toBe(0);
    const big = calculateQuote({ lines: [book({ quantity: 10 })], settings, paymentMethod: "cod" });
    expect(big.codAvailable).toBe(false);
    expect(big.codFeePaise).toBe(0);
    expect(big.codUnavailableReason).toMatch(/up to ₹3000/);
  });

  it("reports COD unavailable when disabled", () => {
    const quote = calculateQuote({ lines: [book()], settings: { ...settings, cod: { ...settings.cod, enabled: false } } });
    expect(quote.codAvailable).toBe(false);
  });

  it("shows inclusive tax without adding it", () => {
    const quote = calculateQuote({
      lines: [book({ unitPricePaise: 11800 })],
      settings: { ...settings, tax: { enabled: true, rate_bps: 1800, prices_include_tax: true } },
    });
    expect(quote.taxPaise).toBe(1800);
    expect(quote.totalPaise).toBe(11800 + 5000);
  });

  it("adds exclusive tax on the discounted goods value", () => {
    const quote = calculateQuote({
      lines: [book({ unitPricePaise: 10000 })],
      settings: { ...settings, tax: { enabled: true, rate_bps: 500, prices_include_tax: false } },
      coupon: coupon({ type: "fixed", value: 2000 }),
      now,
    });
    expect(quote.taxPaise).toBe(400);
    expect(quote.totalPaise).toBe(10000 - 2000 + 5000 + 400);
  });

  it("ignores tax when disabled even if a rate is set", () => {
    const quote = calculateQuote({ lines: [book()], settings: { ...settings, tax: { enabled: false, rate_bps: 1800, prices_include_tax: false } } });
    expect(quote.taxPaise).toBe(0);
  });

  it("returns the coupon error instead of throwing", () => {
    const quote = calculateQuote({ lines: [book()], settings, coupon: coupon({ isActive: false }), now });
    expect(quote.discountPaise).toBe(0);
    expect(quote.couponError).toBe("This coupon code is not valid.");
  });
});

describe("evaluateCoupon", () => {
  it("applies percent discounts rounded down and capped", () => {
    expect(evaluateCoupon(coupon({ value: 15 }), [book({ unitPricePaise: 33333 })], noUsage, now)).toEqual({ ok: true, discountPaise: 4999 });
    expect(evaluateCoupon(coupon({ value: 50, maxDiscountPaise: 10000 }), [book()], noUsage, now)).toEqual({ ok: true, discountPaise: 10000 });
  });

  it("never discounts more than the eligible amount", () => {
    expect(evaluateCoupon(coupon({ type: "fixed", value: 999999 }), [book()], noUsage, now)).toEqual({ ok: true, discountPaise: 45000 });
  });

  it("enforces dates, limits and minimum order", () => {
    expect(evaluateCoupon(coupon({ startsAt: "2026-10-01T00:00:00Z" }), [book()], noUsage, now)).toMatchObject({ ok: false, message: /not active yet/ });
    expect(evaluateCoupon(coupon({ expiresAt: "2026-09-30T09:59:59Z" }), [book()], noUsage, now)).toMatchObject({ ok: false, message: /expired/ });
    expect(evaluateCoupon(coupon({ maxUses: 5 }), [book()], { total: 5, byCustomer: 0 }, now)).toMatchObject({ ok: false, message: /usage limit/ });
    expect(evaluateCoupon(coupon({ perCustomerLimit: 1 }), [book()], { total: 1, byCustomer: 1 }, now)).toMatchObject({ ok: false, message: /already used/ });
    expect(evaluateCoupon(coupon({ minOrderPaise: 50000 }), [book()], noUsage, now)).toMatchObject({ ok: false, message: /₹50 more/ });
  });

  it("restricts to products or categories", () => {
    const lines = [book(), book({ productId: "p2", unitPricePaise: 20000, categoryIds: ["c-hist"] })];
    expect(evaluateCoupon(coupon({ appliesTo: "products", productIds: ["p2"] }), lines, noUsage, now)).toEqual({ ok: true, discountPaise: 2000 });
    expect(evaluateCoupon(coupon({ appliesTo: "categories", categoryIds: ["c-gs"] }), lines, noUsage, now)).toEqual({ ok: true, discountPaise: 4500 });
    expect(evaluateCoupon(coupon({ appliesTo: "categories", categoryIds: ["c-none"] }), lines, noUsage, now)).toMatchObject({ ok: false, message: /does not apply/ });
  });
});
