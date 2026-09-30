# Project Memory

## Current Status (2026-09-30)

All build phases (0-10) implemented and committed. Phase 11 QA done in **setup mode only**
(no Supabase project / payment / shipping credentials available yet).

## Completed

- Next.js 16 app in `src/`, design system from the Target Police cover (docs/DESIGN.md)
- Supabase schema, RLS, transactional functions, storage bucket, seed (6 migrations)
- Storefront: home, listing/filters, category, search + suggestions, product page (gallery, zoom,
  specs, reviews, related, bought-together, JSON-LD), cart, multi-step checkout, order success,
  track order, account (orders, invoices, profile, addresses, wishlist), auth flows, content pages
- Payments: Razorpay adapter (orders, signature verify, capture, webhooks, refunds), dev mock
- Shipping: Shiprocket adapter + manual AWB provider, status mapping, webhook, sync
- Email: Resend adapter + console, order lifecycle templates
- Admin: dashboard + setup checklist + revenue chart, books/stock/images, orders (status,
  shipments, refunds, cancel, notes, invoice), categories, coupons, customers, reviews,
  banners, FAQs, messages, settings (incl. editable policy pages), shipping, payments
- SEO: metadata, OG, Product/Book/Breadcrumb/FAQ/Organization JSON-LD, sitemap, robots
- Security: RLS tests, same-origin guard, rate limits, security headers, secret scan
- Tests: 85 unit/integration tests (Vitest + PGlite); lint, typecheck, production build pass

## Known Issues / Open Questions

- Author spelling: cover "Swathylava Neralla" vs brief "Swathyalava Neralla" (seed uses cover).
- Target Police price, MRP, ISBN, pages, weight, dimensions, binding, stock: to be entered in admin.
- Policy page drafts need the publisher's real terms (return window, dispatch time).
- Not yet tested against live services: Supabase Auth emails, Razorpay (test mode), Shiprocket API,
  Resend. Shiprocket adapter is written from their public API docs and untested.
- Visual QA of data-filled pages (product page, cart, checkout, admin) pending a real Supabase project.

## Next Step

Create Supabase project → apply migrations → set env → run TEST_PLAN E2E with Razorpay test keys.
