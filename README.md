# Aarohi Lava Publications: online bookstore

Ecommerce site for selling exam-preparation books (TSLPRB, TGPSC and other competitive
exams): catalog, server-side cart, checkout with Razorpay or cash on delivery, shipping via
Shiprocket or manual AWB entry, order tracking, customer accounts and an admin dashboard.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage) · Razorpay · Shiprocket · Resend · Vercel
- **Docs:** [PRD](docs/PRD.md) · [Architecture](docs/ARCHITECTURE.md) · [Design](docs/DESIGN.md) · [Rules](docs/RULES.md) · [Security](docs/SECURITY.md) · [Test plan](docs/TEST_PLAN.md) · [Decisions](docs/DECISIONS.md) · [Current state](docs/MEMORY.md) · [Tasks](TASKS.md)

## Quick start (local)

```bash
npm install
cp .env.example .env.local      # fill in values, see below
npm run dev                     # http://localhost:3000
```

Without Supabase values the site runs in **setup mode**: pages render with a yellow banner
and catalog/cart/checkout are unavailable. Nothing crashes.

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | Route types + `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Unit tests + database/RLS tests (PGlite, no Docker needed) |

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (region: Mumbai `ap-south-1`).
2. **Apply the migrations** in `supabase/migrations/` in filename order. Either:
   - Supabase CLI: `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push`, or
   - SQL editor: paste each file in order and run it.
3. **Keys** (Project Settings > API): `NEXT_PUBLIC_SUPABASE_URL`, the publishable/anon key as
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the secret/service-role key as `SUPABASE_SERVICE_ROLE_KEY`
   (server only, never expose it).
4. **Auth settings** (Authentication):
   - URL configuration: Site URL = your domain; add `https://<domain>/auth/confirm` and
     `http://localhost:3000/auth/confirm` to Redirect URLs.
   - Email templates: in *Confirm signup* and *Reset password*, point the link to
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account`
     (use `type=recovery` for Reset password). This works even if the link is opened on another device.
   - Set up a custom SMTP sender for auth emails before launch (Supabase's built-in sender is rate limited).
   - Enable leaked-password protection.
5. **Make yourself admin** after signing up on the site once:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
   Then open `/admin`.

## 2. Store setup in the admin

Open `/admin`. The dashboard shows a **setup checklist**. Before launch:

- **Books & stock:** open *Target Police* and set MRP, selling price, stock, ISBN, pages, weight and the rest.
  The seed contains only facts printed on the cover; everything else is blank on purpose.
- **Settings:** store contact details, shipping fee / free-shipping threshold (tick "reviewed"),
  COD on/off, tax (off by default, since printed books are generally GST-exempt: confirm with your accountant).
- **Settings > Pages:** review the About, Shipping, Returns, Privacy and Terms drafts and add your own
  timelines and return window.

## 3. Razorpay

1. Get API keys (Dashboard > Account & Settings > API Keys). Start with **test** keys.
2. `.env`: `PAYMENT_PROVIDER=razorpay`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
3. Webhook (Dashboard > Webhooks): URL `https://<domain>/api/webhooks/razorpay`, a strong secret
   (put it in `RAZORPAY_WEBHOOK_SECRET`), events: `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`.
4. Keep automatic capture enabled (the site also captures authorized payments itself).
5. Test with Razorpay test cards/UPI on a preview deployment, then switch to live keys.

`PAYMENT_PROVIDER=mock` gives a clearly labelled simulated gateway for local development. It is
refused on production deployments.

## 4. Shipping

- **Manual (default, `SHIPPING_PROVIDER=manual`):** book the courier yourself; in the admin open the
  order and enter courier + AWB + tracking link. The customer is emailed and can track it.
- **Shiprocket (`SHIPPING_PROVIDER=shiprocket`):**
  1. Create an API user (Settings > API > Configure > Create an API User).
  2. `SHIPPING_API_KEY` = API user email, `SHIPPING_API_SECRET` = its password.
  3. `SHIPROCKET_PICKUP_LOCATION` = pickup location nickname exactly as in Shiprocket,
     `SHIPROCKET_PICKUP_PINCODE` = its pincode.
  4. Tracking webhook (Settings > API > Webhooks): URL `https://<domain>/api/webhooks/shiprocket`,
     token = `SHIPROCKET_WEBHOOK_TOKEN`. (Shiprocket may reject URLs containing its own name. If so,
     add a rewrite such as `/api/webhooks/courier` pointing to this route.)
  5. Optional: Admin > Settings > Orders > "create the courier shipment automatically".

## 5. Email (Resend)

`EMAIL_PROVIDER=resend`, `EMAIL_API_KEY`, `EMAIL_FROM` (a verified domain sender),
`ADMIN_NOTIFICATION_EMAIL` (new orders and contact messages). With `EMAIL_PROVIDER=console`
emails are only logged (development only).

## 6. Deploy to Vercel

1. Push to GitHub and import the repo in Vercel (framework: Next.js, Node 24).
2. Add every variable from `.env.example` for **Preview** (test keys) and **Production** (live keys).
   Set `NEXT_PUBLIC_SITE_URL` to the deployment's public URL.
3. `CRON_SECRET`: a long random string. `vercel.json` runs `/api/cron/expire-orders` every 15
   minutes to release stock from abandoned payments (on the Hobby plan crons run daily; the site
   also releases expired reservations whenever someone adds to cart or checks out).
4. Deploy a preview, run the checklist in [docs/TEST_PLAN.md](docs/TEST_PLAN.md) with test keys, then promote to production.
5. Point your domain, update Supabase Site URL/Redirect URLs, Razorpay and Shiprocket webhook URLs.

## Project structure

```
src/app/(store)   storefront, auth, account, checkout, tracking, content pages
src/app/admin     admin dashboard (role-gated)
src/app/api       checkout, payments, webhooks, cron, search, shipping routes
src/actions       Server Actions (validated with zod; admin ones wrapped by withAdmin)
src/services      business logic and data access
src/lib           supabase clients, payments/, shipping/, email/, validation/, utils
supabase/         migrations (schema, RLS, functions, storage, seed)
tests/            unit + integration (PGlite RLS tests)
```
