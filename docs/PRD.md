# Product Requirements Document

## Product

Aarohi Lava Publications online bookstore (working name, configurable in admin settings).

## Problem

Aarohi Lava Publications publishes exam-preparation books for Telangana competitive exams
(TSLPRB, TGPSC and others). Aspirants currently have no direct, trustworthy way to buy these
books from the publisher online, pay securely, and track delivery. The publisher has no system
to manage stock, orders, payments and shipments in one place.

## Target Users

1. **Aspirants (customers)**: candidates preparing for TSLPRB (police SI / constable), TGPSC
   and other state/central exams. Mostly Telangana-based, mostly on mobile phones, price
   conscious, need to trust the seller before paying online.
2. **Publisher staff (admins)**: need to list books, set prices and stock, process orders,
   create shipments and answer "where is my order" questions.

## Goal

A production-ready ecommerce website where customers can find a book, pay (online or COD
when enabled), and track it to their door, and where the publisher can run the whole store
from an admin dashboard.

## Core Features

1. Catalog: books, categories, search, filters, SEO product pages
2. Cart: server-validated cart with stock checks
3. Checkout: customer details, address, shipping, payment, coupon, tax
4. Payments: Razorpay (online) and optional Cash on Delivery
5. Shipping: provider abstraction (Shiprocket first), serviceability, AWB, tracking
6. Order tracking: public tracking by order ID + phone/email
7. Customer accounts: login, register, verification, password reset, addresses, orders
8. Admin: dashboard, books, inventory, orders, customers, categories, coupons, reviews,
   banners, FAQs, settings, shipping, payments
9. Notifications: email on order lifecycle events

## MVP (first production release)

- Browse / search / filter books; product page with gallery, specs, reviews
- Cart with server-side pricing and stock validation
- Guest and logged-in checkout with Razorpay; COD behind a setting
- Payment verification + verified, idempotent webhooks
- Inventory reservation on order, commit on payment, release on failure/expiry
- Coupons (percent / fixed, min order, expiry, usage limits, product/category restrictions)
- Configurable tax (GST) and shipping fees
- Shipping via Shiprocket adapter, with a manual (admin-entered AWB) fallback
- Order tracking page and customer order history
- Admin CRUD for books, categories, coupons, banners, FAQs; order management; analytics
- SEO: metadata, Open Graph, Product + Breadcrumb JSON-LD, sitemap, robots

## Out of Scope (v1)

- Mobile app
- Phone / OTP login (architecture must allow adding it later)
- Multiple payment gateways live at once (architecture must allow a second one later)
- E-books / digital downloads
- Marketplace / multiple sellers
- Multi-language UI (Telugu UI can come later; book language is a product field)
- Loyalty points, referral programs, subscriptions
- Automated GST e-invoicing integration

## Content Rules

- Only publish product facts visible on the cover or supplied by the publisher.
- Never invent ISBN, price, page count, weight, stock, ratings, reviews, awards or claims.
- Unknown values are nullable fields, shown as "not yet available" or hidden, and a book
  without a price cannot be added to the cart.

## Initial Product (from the supplied cover)

| Field | Value | Source |
|---|---|---|
| Title | Target Police | Cover |
| Subtitle | 360° Explanation of General Studies: Previous Question Papers | Cover |
| Exams | TSLPRB, TGPSC and other competitive exams | Cover |
| Edition note | Updated with 2026 data | Cover |
| Author | Swathylava Neralla (MSc, MA) | Cover (brief spells "Swathyalava": to confirm) |
| Publisher | Aarohi Lava Publications | Cover logo |
| Coverage | All Telangana SI previous papers (Prelims & Mains), subjects listed on cover | Cover |
| Price, MRP, ISBN, pages, weight, dimensions, binding, stock | Not provided | Admin to fill |

## Success Criteria

A customer can:

1. Find the book through browse, category or search
2. Add it to the cart and see a server-calculated total
3. Check out as a guest or logged-in user and pay with Razorpay (test mode)
4. See an order confirmation and receive an email
5. Track the order with order ID + phone or email
6. See order history in their account

An admin can:

1. Set price, MRP, stock and publish a book
2. See a paid order, create a shipment (or enter an AWB manually) and update its status
3. See sales totals, low-stock books and best sellers
4. Create a coupon and see it applied correctly at checkout

Security: customer A can never read customer B's orders; non-admins can never reach admin
functions; prices and stock are never trusted from the browser.
