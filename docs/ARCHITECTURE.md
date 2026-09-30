# Architecture

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions, Route Handlers) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (tokens in `src/app/globals.css`) |
| Database | Supabase PostgreSQL (schema in `supabase/migrations/`) |
| Auth | Supabase Auth (email + password, email verification, password reset) |
| Storage | Supabase Storage (`product-images` bucket) |
| Payments | Razorpay behind `src/lib/payments` adapter |
| Shipping | Shiprocket behind `src/lib/shipping` adapter (+ manual provider) |
| Email | Resend behind `src/lib/email` adapter (+ console provider for dev) |
| Validation | zod |
| Icons | Phosphor |
| Tests | Vitest (unit + DB/RLS integration via PGlite), Playwright CLI (e2e/manual QA) |
| Hosting | Vercel (Node.js runtime) |

## Request flow

```
Browser
  ↓
Next.js (Vercel)
  ├─ Server Components  → src/services/* (read)  → Supabase (anon key + RLS)
  ├─ Server Actions / Route Handlers → validation (zod) → src/services/* (write)
  │     ├─ Supabase (user session, RLS)            customer-owned data
  │     ├─ Supabase (service role, server only)    orders, payments, inventory, carts
  │     ├─ src/lib/payments  → Razorpay API
  │     ├─ src/lib/shipping  → Shiprocket API
  │     └─ src/lib/email     → Resend API
  └─ Webhooks (/api/webhooks/*) → signature check → idempotency table → services
```

## Folder structure

```
src/
├── app/                  routes only (pages, layouts, route handlers, server actions glue)
│   ├── (store)/          public storefront + account (shared header/footer)
│   ├── admin/            admin dashboard (own layout, role-gated)
│   └── api/              route handlers: webhooks, cart, search, shipping, payments, cron
├── components/
│   ├── ui/               primitives: Button, Input, Select, Badge, Modal, Drawer, Toast…
│   ├── ecommerce/        ProductCard, ProductGrid, BookGallery, PriceDisplay, Rating…
│   ├── checkout/         CheckoutForm, AddressForm, OrderSummary…
│   ├── account/          account pieces
│   └── admin/            AdminSidebar, AdminTable, admin forms
├── services/             business logic + data access (no JSX)
│   ├── catalog.ts        products, categories, search (read)
│   ├── cart.ts           server cart
│   ├── pricing.ts        pure price / coupon / tax / shipping maths
│   ├── orders.ts         place order, finalize payment, status changes
│   ├── shipping.ts       shipment creation + tracking sync
│   └── …
├── lib/
│   ├── supabase/         client factories: server (user), public (anon, cacheable), admin (service role)
│   ├── payments/         PaymentProvider interface, razorpay, mock
│   ├── shipping/         ShippingProvider interface, shiprocket, manual, status mapping
│   ├── email/            EmailProvider interface, resend, console, templates
│   ├── validation/       zod schemas shared by actions and route handlers
│   ├── auth.ts           getUser / requireUser / requireAdmin
│   ├── env.ts            typed env access, feature detection (configured or not)
│   ├── rate-limit.ts     Postgres-backed limiter
│   └── utils/            money, format, slug, errors
├── types/                domain types (Product, Order, …)
└── proxy.ts              session refresh + optimistic redirects (Next 16 "proxy")

supabase/migrations/      SQL migrations (schema, RLS, functions, seed)
tests/unit                pure logic (pricing, signatures, status mapping, validation)
tests/integration         migrations + RLS executed on PGlite
tests/e2e                 Playwright flows
docs/                     PRD, ARCHITECTURE, DESIGN, RULES, TEST_PLAN, SECURITY, DECISIONS, MEMORY
```

## Architectural rules

- UI components never talk to the database or third-party APIs. They call services (server)
  or route handlers / server actions (client).
- Payment, shipping and email API calls exist **only** inside `src/lib/payments`,
  `src/lib/shipping`, `src/lib/email`.
- The service-role client lives in `src/lib/supabase/admin.ts`, imports `server-only`, and is
  used only in services for: carts, orders, payments, inventory, webhooks, admin writes after
  `requireAdmin()`.
- Prices, discounts, tax, shipping and stock are computed on the server from database values
  (`services/pricing.ts` is pure and unit-tested). The browser only sends product IDs,
  quantities, coupon code, address and payment method.
- Order placement, payment finalisation and inventory changes run inside Postgres functions
  so they are atomic and idempotent.
- Public catalog pages are server-rendered with time-based revalidation (ISR) and
  on-demand `revalidatePath` after admin edits. Header cart count is a small client island so
  catalog pages stay cacheable.

## Order lifecycle

```
PENDING_PAYMENT → PAID → PROCESSING → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
      │             │                                          │
      ├→ CANCELLED  ├→ CANCELLED → REFUNDED                    └→ RETURN_REQUESTED → RETURNED → REFUNDED
```

- COD orders skip PENDING_PAYMENT and start at PROCESSING (payment status `cod_pending`).
- Provider statuses (e.g. Shiprocket "IN TRANSIT", "RTO DELIVERED") are mapped to internal
  statuses in `src/lib/shipping/status-map.ts`. Unknown provider statuses are stored as events
  but do not change the order status.

## Inventory

`inventory(product_id, quantity, reserved, low_stock_threshold, allow_backorder)`

1. `place_order()` reserves: `reserved += qty` only if `quantity - reserved >= qty`
   (or backorder allowed). Fails the whole order otherwise.
2. `finalize_paid_order()` commits: `quantity -= qty, reserved -= qty`. Idempotent.
3. `release_order_inventory()` on payment failure / cancellation / expiry (30 min).

## Payments flow (Razorpay)

1. Client submits checkout (IDs + quantities only) → server validates cart, computes quote.
2. `place_order()` (DB) inserts order + items, reserves stock, returns order.
3. Payment adapter creates a Razorpay order for the server-computed amount (paise).
4. Browser opens Razorpay Checkout with the Razorpay order ID.
5. Browser posts the result to `/api/payments/verify` → HMAC check → `finalize_paid_order()`.
6. Razorpay webhook (`/api/webhooks/razorpay`) does the same independently (signature
   verified, event ID stored for idempotency) so a closed tab still gets the order paid.

## Shipping flow

1. Checkout: `checkServiceability(pincode)` via adapter. Fee comes from store settings.
2. Admin (or automatic, if enabled) creates a shipment → provider order + AWB.
3. Tracking: provider webhook and/or manual "Sync" pull events → `shipping_events` →
   mapped order status.

## Environment modes

- Each integration reports whether it is configured (`src/lib/env.ts`).
- `PAYMENT_PROVIDER=mock` and `EMAIL_PROVIDER=console` exist for development only, are shown
  with a visible "Test mode" banner, and refuse to run when `VERCEL_ENV=production`.
- If Supabase is not configured, pages render a clear "store not configured" state instead
  of crashing, so the build succeeds without credentials.
