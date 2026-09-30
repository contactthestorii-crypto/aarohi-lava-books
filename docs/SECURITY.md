# Security Requirements

## Secrets

- Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
  `SHIPPING_API_SECRET` (Shiprocket password), `SHIPROCKET_WEBHOOK_TOKEN`, `EMAIL_API_KEY`, `CRON_SECRET`.
- Only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key) and
  `NEXT_PUBLIC_SITE_URL` are bundled for the browser. The Razorpay key id (public by design)
  is sent per checkout by the server.
- Test-only integrations (`PAYMENT_PROVIDER=mock`, `EMAIL_PROVIDER=console`) are refused when
  `VERCEL_ENV=production`. If you host outside Vercel, never set these in production.
- Files that use secrets import `server-only` so a client import fails the build.
- `.env*` is git-ignored except `.env.example` (placeholders only).

## Authentication

- Supabase Auth, email + password, email confirmation required before checkout history
  links to the account.
- Sessions refreshed in `src/proxy.ts`; every protected page and action re-checks the user on
  the server with `supabase.auth.getUser()` (proxy checks are optimistic only).
- `/account/**` requires a signed-in user. `/admin/**` requires `profiles.role = 'admin'`.

## Authorization

- Role is stored in `public.profiles.role`. Users cannot change it: column-level
  `UPDATE` grants exclude `role`.
- `public.is_admin()` (security definer, fixed `search_path`, execute granted only to
  `authenticated`) is used in admin RLS policies.
- Customers can read only their own profile, addresses, orders, order items, payments
  (read-only), shipments, wishlist and reviews.
- Customers can never insert or update orders, payments, inventory, products, coupons or
  shipments. Those writes happen only on the server with the service role after validation.
- Guest order access (tracking, confirmation) requires order number **and** matching phone or
  email, or the unguessable per-order `access_token`. Checked server-side.

## Database (RLS)

- RLS enabled on every table in `public`.
- Policies use `to authenticated` / `to anon` plus ownership predicates; never `auth.role()`.
- UPDATE policies have both `using` and `with check`.
- Privileged functions (`place_order`, `finalize_paid_order`, …) have `EXECUTE` revoked from
  `public`, `anon`, `authenticated`; only `service_role` can call them.
- Storage: `product-images` is public-read; only admins can write.

## Input validation

- zod schemas for every action and route handler (`src/lib/validation`).
- Indian phone (10 digits, 6-9 start), 6-digit pincode, email, lengths capped.
- Text rendered through React (auto-escaped). No `dangerouslySetInnerHTML` except JSON-LD
  built from our own data with `<` escaped.

## Payments

- Amount always computed on the server from DB prices.
- Client callback verified with HMAC-SHA256 (`order_id|payment_id`, key secret).
- Webhook verified with HMAC-SHA256 of the raw body using the webhook secret, compared in
  constant time. Event IDs stored in `webhook_events` (unique) for idempotency.
- Order finalisation is idempotent (conditional status update inside a DB function).

## Shipping webhooks

- Shiprocket webhook requires the `x-api-key` header to equal `SHIPROCKET_WEBHOOK_TOKEN`
  (constant-time compare). Payloads validated with zod.

## CSRF

- Server Actions: Next.js checks the Origin header automatically.
- Cookie-authenticated JSON route handlers (`/api/checkout/*`, `/api/payments/*`) call
  `rejectCrossSite()` (`src/lib/http.ts`).
- Webhooks and cron are authenticated by signature/secret instead.

## Rate limiting

Postgres-backed fixed-window limiter (`rate_limit_hit`) on: order tracking, coupon checks,
pincode checks, checkout/place order, contact form, newsletter, review submission.

## File uploads (admin)

- Types: JPEG, PNG, WebP only. Max 5 MB. Filenames replaced with random UUIDs.

## Errors and logging

- Customers see plain messages ("Payment could not be verified. You have not been charged
  twice; please contact us with order AL-XXXX").
- Stack traces and provider responses are logged server-side only (`src/lib/utils/log.ts`).

## Headers

Security headers in `next.config.ts`: `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
`X-Frame-Options: DENY`, `Permissions-Policy`, HSTS.
