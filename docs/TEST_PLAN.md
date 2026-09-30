# Test Plan

Commands: `npm run typecheck` · `npm run lint` · `npm test` (unit + integration) ·
`npm run build` · e2e with Playwright CLI against `npm run dev` / preview URL.

## Unit (tests/unit)

- Pricing: subtotal, MRP savings, coupon percent/fixed/cap/min order, tax inclusive and
  exclusive, free-shipping threshold, COD fee, rounding in paise, never negative.
- Coupons: expired, not started, inactive, usage limit reached, per-customer limit,
  product/category restriction, below minimum.
- Payments: Razorpay payment signature and webhook signature verification (valid, tampered,
  wrong secret); mock provider refuses production.
- Shipping: Shiprocket status mapping (every known status + unknown), serviceability
  response parsing.
- Validation: phone, pincode, email, checkout payload, address.

## Integration: database (tests/integration, PGlite)

Migrations apply cleanly on an empty database. Then, as roles `anon` / `authenticated`:

- Anyone can read published products, categories, images; not unpublished/archived.
- Customer can read own orders/items/payments/shipments; **cannot read another customer's**.
- Customer can update own profile name/phone; **cannot change own role**.
- Customer **cannot** insert/update orders, payments, inventory, products, coupons.
- Customer can manage own addresses and wishlist only.
- Reviews: public sees approved only; customer sees own pending review.
- Admin (`profiles.role = admin`) can manage products, categories, orders.
- `place_order` reserves stock and fails when insufficient; `finalize_paid_order` is
  idempotent (second call is a no-op); `release_order_inventory` returns stock once.
- Anon/authenticated cannot execute privileged functions.

## E2E (Playwright, needs a configured Supabase project + Razorpay test keys)

1. Home → search "Target Police" → product page → Add to Cart → cart shows server total.
2. Cart: change quantity, remove, apply valid/invalid coupon.
3. Guest checkout → Razorpay test payment (success card) → order-success → email logged.
4. Payment failure card → order stays PENDING_PAYMENT, retry works, no duplicate order.
5. Track order with order ID + phone; wrong phone shows generic "not found".
6. Register → verify email → login → account orders show the order → order detail.
7. Customer B cannot open customer A's `/account/orders/[id]` (404).
8. Non-admin visiting `/admin` is redirected; admin sees dashboard.
9. Admin: create book with image, set price/stock, publish → visible on /books.
10. Admin: open paid order → create shipment (or manual AWB) → tracking shows AWB.

## Responsive / manual QA

At 375px, 768px, 1024px, 1440px: header one line, no horizontal scroll, sticky buy bar on
mobile product page, checkout usable with thumb, admin tables scroll inside their container.

## Pre-deploy checklist

- [ ] typecheck, lint, tests, build pass
- [ ] No secrets in git (`git grep -nE "rzp_live|sb_secret|service_role"` clean)
- [ ] RLS tests pass
- [ ] Razorpay test payment + webhook verified on preview URL
- [ ] Sitemap, robots, product JSON-LD validate
