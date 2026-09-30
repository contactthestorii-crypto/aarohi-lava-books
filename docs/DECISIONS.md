# Architecture Decisions

## ADR-001 Next.js 16 App Router, single app
Decision: One Next.js app serves storefront, admin and API (route handlers/server actions).
Reason: No separate backend needed; server components give SEO-friendly pages; deploys to Vercel.

## ADR-002 Supabase for DB, Auth, Storage
Decision: Supabase Postgres + Auth + Storage, schema managed as SQL migrations.
Reason: Requested stack; RLS gives defence in depth; one vendor for data, auth and files.

## ADR-003 Money in paise (integers)
Decision: All amounts stored and computed as integer paise.
Reason: Avoids floating point errors; Razorpay expects paise.

## ADR-004 Server-side cart
Decision: Cart lives in `carts`/`cart_items`, identified by an httpOnly `cart_id` cookie for
guests and linked to `user_id` after login (guest cart merges into user cart).
Reason: Spec requires cart tables; prices and stock are never taken from the browser;
cart survives across devices for logged-in users.

## ADR-005 Atomic order + inventory in Postgres functions
Decision: `place_order`, `finalize_paid_order`, `release_order_inventory` are SQL functions
callable only by the service role.
Reason: Prevents overselling under concurrency and makes webhook + client verification
idempotent in one transaction.

## ADR-006 Provider adapters
Decision: `PaymentProvider`, `ShippingProvider`, `EmailProvider` interfaces with one module
per provider, selected by env var.
Reason: Adding PayU/Cashfree or Delhivery later must not touch business logic.

## ADR-007 No SDKs for Razorpay/Shiprocket/Resend
Decision: Call their REST APIs with `fetch`.
Reason: Keeps dependencies minimal; the APIs used are small; easier to test.

## ADR-008 Flat, configurable shipping fees; provider for serviceability and shipments
Decision: Customer shipping fee comes from store settings (flat fee, free-above threshold,
COD fee). The shipping provider is used for pincode serviceability, AWB, tracking.
Reason: Predictable prices for customers; courier rates vary per shipment and are a business
cost, not something to expose at checkout for a single-publisher store.

## ADR-009 Manual shipping provider
Decision: A `manual` provider lets admins type courier + AWB + tracking URL.
Reason: Real production fallback when Shiprocket is not yet configured; not a fake.

## ADR-010 Test/mock modes are explicit
Decision: `PAYMENT_PROVIDER=mock` and `EMAIL_PROVIDER=console` only for development, show a
"Test mode" banner, and throw in `VERCEL_ENV=production`.
Reason: Spec forbids fake functionality in production but work must be testable without keys.

## ADR-011 Tax configurable, default off
Decision: `tax_enabled`, `tax_rate_bps`, `prices_include_tax`, `gstin` in settings; default
disabled.
Reason: Printed books are generally GST-exempt in India, but the publisher/CA must confirm; the
system must not hardcode tax assumptions.

## ADR-012 Light theme only
Decision: Storefront ships a single light theme.
Reason: Brand (from the cover) is navy/white print identity; one theme keeps QA focused.
Dark mode can be added through the tokens later.

## ADR-013 Postgres-backed rate limiting
Decision: `rate_limits` table + `rate_limit_hit()` function.
Reason: Works on Vercel without adding Redis/Upstash; low traffic volume.

## ADR-014 Tests with Vitest + PGlite
Decision: Unit tests with Vitest; migrations and RLS tested against PGlite (Postgres in
WASM) with stubbed `auth` schema and roles.
Reason: No Docker on the dev machine; still gives real Postgres semantics for RLS tests.

## ADR-015 Fonts: Archivo + Hanken Grotesk via next/font
Reason: Condensed heavy display echoes the cover; Hanken Grotesk is highly readable at small
sizes; both self-hosted by next/font (no layout shift, no external requests).

## ADR-016 Store brand from the cover
Decision: Store name "Aarohi Lava Publications" (publisher logo on the cover), editable in
settings.
