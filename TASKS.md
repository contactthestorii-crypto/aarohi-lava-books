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
- [x] TASK-012 Header (desktop + mobile drawer), Footer, test-mode banner
- [x] TASK-013 Homepage sections (static structure, data wired in Phase 2)

## Phase 2: Catalog
- [x] TASK-020 Migration: core schema (profiles, categories, products, images, inventory, settings, banners, faqs)
- [x] TASK-021 Migration: commerce schema (addresses, carts, orders, payments, shipments, coupons, reviews, wishlists, webhooks, rate limits)
- [x] TASK-022 Migration: RLS policies + storage bucket
- [x] TASK-023 Migration: functions (place_order, finalize, release, search, rate limit, rating trigger)
- [x] TASK-024 Seed: categories + Target Police product (cover-only facts)
- [x] TASK-025 Integration tests: migrations + RLS on PGlite
- [x] TASK-026 Supabase client factories + catalog service
- [x] TASK-027 /books listing with filters, sort, pagination
- [x] TASK-028 /books/[slug] product page (gallery, zoom, specs, reviews, related)
- [x] TASK-029 /categories/[slug], /search + suggestions API

## Phase 3: Cart
- [x] TASK-030 Pricing engine (pure) + unit tests
- [x] TASK-031 Cart service + API + cart page + header badge
- [x] TASK-032 Coupon validation service + tests

## Phase 4: Auth & account
- [x] TASK-040 proxy.ts session refresh; login, register, verify, forgot/reset password, logout
- [x] TASK-041 /account, profile, addresses CRUD, wishlist
- [x] TASK-042 /account/orders + order details

## Phase 5: Checkout
- [x] TASK-050 Quote API (shipping, tax, coupon, COD)
- [x] TASK-051 Multi-step checkout UI
- [x] TASK-052 Place order action (idempotent) + inventory reservation

## Phase 6: Payments
- [x] TASK-060 Payment adapter (Razorpay + mock) + tests
- [x] TASK-061 Verify endpoint + finalize order + emails
- [x] TASK-062 Razorpay webhook (verified, idempotent) + retry payment
- [x] TASK-063 Order expiry cron

## Phase 7: Shipping
- [x] TASK-070 Shipping adapter (Shiprocket + manual) + status map + tests
- [x] TASK-071 Pincode serviceability API + product page checker
- [x] TASK-072 Shipment creation, tracking sync, Shiprocket webhook
- [x] TASK-073 /track-order + order-success pages

## Phase 8: Admin
- [x] TASK-080 Admin layout, guard, dashboard analytics
- [x] TASK-081 Books CRUD + images + inventory
- [x] TASK-082 Orders list/detail, status updates, shipments, refunds
- [x] TASK-083 Customers, categories, coupons, reviews
- [x] TASK-084 Settings, banners, FAQs, shipping & payments pages

## Phase 9: Content & SEO
- [x] TASK-090 About, contact (form), FAQ, policy pages
- [x] TASK-091 Metadata, OG, JSON-LD, sitemap, robots

## Phase 10: Security
- [x] TASK-100 Security headers, rate limits wired, secret scan, review against SECURITY.md

## Phase 11: Testing & QA
- [x] TASK-110 Lint, typecheck, unit, integration, build all green
- [~] TASK-111 Playwright QA at 375/1440: setup-mode pages done; data-filled pages pending Supabase credentials
- [x] TASK-112 README setup + deployment guide; final report
