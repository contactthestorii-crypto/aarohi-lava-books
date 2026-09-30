# Tasks

Workflow per task: read → plan → implement → test → review → commit → update docs.

## Phase 0: Planning & setup
- [x] TASK-001 Scaffold Next.js 16 + TypeScript + Tailwind v4 in `src/`
- [x] TASK-002 Git init, `.gitignore` keeps `.env.example`
- [x] TASK-003 Project docs (PRD, ARCHITECTURE, DESIGN, RULES, SECURITY, TEST_PLAN, DECISIONS, MEMORY, TASKS)
- [x] TASK-004 `.env.example`, typed env module, scripts (typecheck, test), Vitest config

## Phase 1: Foundation
- [x] TASK-010 Design tokens + fonts in globals.css/layout
- [x] TASK-011 UI primitives (Button, Input, Select, Textarea, Badge, Skeleton, EmptyState, ErrorState, Modal, Drawer, Toast)
- [ ] TASK-012 Header (desktop + mobile drawer), Footer, test-mode banner
- [ ] TASK-013 Homepage sections (static structure, data wired in Phase 2)

## Phase 2: Catalog
- [x] TASK-020 Migration: core schema (profiles, categories, products, images, inventory, settings, banners, faqs)
- [x] TASK-021 Migration: commerce schema (addresses, carts, orders, payments, shipments, coupons, reviews, wishlists, webhooks, rate limits)
- [x] TASK-022 Migration: RLS policies + storage bucket
- [x] TASK-023 Migration: functions (place_order, finalize, release, search, rate limit, rating trigger)
- [x] TASK-024 Seed: categories + Target Police product (cover-only facts)
- [x] TASK-025 Integration tests: migrations + RLS on PGlite
- [x] TASK-026 Supabase client factories + catalog service
- [ ] TASK-027 /books listing with filters, sort, pagination
- [ ] TASK-028 /books/[slug] product page (gallery, zoom, specs, reviews, related)
- [ ] TASK-029 /categories/[slug], /search + suggestions API

## Phase 3: Cart
- [ ] TASK-030 Pricing engine (pure) + unit tests
- [ ] TASK-031 Cart service + API + cart page + header badge
- [ ] TASK-032 Coupon validation service + tests

## Phase 4: Auth & account
- [ ] TASK-040 proxy.ts session refresh; login, register, verify, forgot/reset password, logout
- [ ] TASK-041 /account, profile, addresses CRUD, wishlist
- [ ] TASK-042 /account/orders + order details

## Phase 5: Checkout
- [ ] TASK-050 Quote API (shipping, tax, coupon, COD)
- [ ] TASK-051 Multi-step checkout UI
- [ ] TASK-052 Place order action (idempotent) + inventory reservation

## Phase 6: Payments
- [ ] TASK-060 Payment adapter (Razorpay + mock) + tests
- [ ] TASK-061 Verify endpoint + finalize order + emails
- [ ] TASK-062 Razorpay webhook (verified, idempotent) + retry payment
- [ ] TASK-063 Order expiry cron

## Phase 7: Shipping
- [ ] TASK-070 Shipping adapter (Shiprocket + manual) + status map + tests
- [ ] TASK-071 Pincode serviceability API + product page checker
- [ ] TASK-072 Shipment creation, tracking sync, Shiprocket webhook
- [ ] TASK-073 /track-order + order-success pages

## Phase 8: Admin
- [ ] TASK-080 Admin layout, guard, dashboard analytics
- [ ] TASK-081 Books CRUD + images + inventory
- [ ] TASK-082 Orders list/detail, status updates, shipments, refunds
- [ ] TASK-083 Customers, categories, coupons, reviews
- [ ] TASK-084 Settings, banners, FAQs, shipping & payments pages

## Phase 9: Content & SEO
- [ ] TASK-090 About, contact (form), FAQ, policy pages
- [ ] TASK-091 Metadata, OG, JSON-LD, sitemap, robots

## Phase 10: Security
- [ ] TASK-100 Security headers, rate limits wired, secret scan, review against SECURITY.md

## Phase 11: Testing & QA
- [ ] TASK-110 Lint, typecheck, unit, integration, build all green
- [ ] TASK-111 Playwright QA at 375/768/1440 (storefront without DB + with DB when credentials exist)
- [ ] TASK-112 README setup + deployment guide; final report
