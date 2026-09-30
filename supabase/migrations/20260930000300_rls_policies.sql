-- Row Level Security and grants. See docs/SECURITY.md.
-- Principle: revoke everything from client roles, then grant only what each role needs.
-- Writes to orders, payments, inventory, carts, shipments happen on the server with the
-- service role (which bypasses RLS) after validation.

-- ---------------------------------------------------------------------------
-- Admin helper
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere in public
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory enable row level security;
alter table public.settings enable row level security;
alter table public.banners enable row level security;
alter table public.faqs enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.payments enable row level security;
alter table public.shipments enable row level security;
alter table public.shipping_events enable row level security;
alter table public.coupon_usage enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.webhook_events enable row level security;
alter table public.rate_limits enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- ---------------------------------------------------------------------------
-- Grants (table level). RLS policies below narrow these to rows.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Public catalog and content: readable by everyone
grant select on public.categories, public.products, public.product_categories,
  public.product_images, public.inventory, public.settings, public.banners,
  public.faqs, public.reviews
to anon, authenticated;

-- Catalog/content management: authenticated role, restricted to admins by RLS
grant insert, update, delete on public.categories, public.products, public.product_categories,
  public.product_images, public.inventory, public.settings, public.banners, public.faqs
to authenticated;
grant select, insert, update, delete on public.coupons to authenticated;
grant update, delete on public.reviews to authenticated;

-- Profiles: users may edit only their name and phone (never role or email)
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Customer-owned data
grant select, insert, update, delete on public.addresses, public.wishlists to authenticated;
grant select on public.carts, public.cart_items to authenticated;

-- Orders and related: read-only for customers; admins may update status/notes
grant select on public.orders, public.order_items, public.order_events, public.payments,
  public.shipments, public.shipping_events, public.coupon_usage
to authenticated;
grant update (status, admin_note, needs_attention) on public.orders to authenticated;

-- Admin inbox
grant select, update on public.contact_messages, public.newsletter_subscribers to authenticated;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create policy "profiles: read own" on public.profiles
for select to authenticated
using ((select auth.uid()) = id or (select public.is_admin()));

create policy "profiles: update own" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- Catalog (public read of published/active rows, admin full access)
-- ---------------------------------------------------------------------------
create policy "categories: public read active" on public.categories
for select to anon, authenticated
using (is_active);

create policy "categories: admin all" on public.categories
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "products: public read published" on public.products
for select to anon, authenticated
using (status = 'published');

create policy "products: admin all" on public.products
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "product_categories: public read" on public.product_categories
for select to anon, authenticated
using (exists (
  select 1 from public.products p
  where p.id = product_id and p.status = 'published'
));

create policy "product_categories: admin all" on public.product_categories
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "product_images: public read" on public.product_images
for select to anon, authenticated
using (exists (
  select 1 from public.products p
  where p.id = product_id and p.status = 'published'
));

create policy "product_images: admin all" on public.product_images
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "inventory: public read published" on public.inventory
for select to anon, authenticated
using (exists (
  select 1 from public.products p
  where p.id = product_id and p.status = 'published'
));

create policy "inventory: admin all" on public.inventory
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "settings: public read" on public.settings
for select to anon, authenticated
using (true);

create policy "settings: admin all" on public.settings
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "banners: public read active" on public.banners
for select to anon, authenticated
using (
  is_active
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

create policy "banners: admin all" on public.banners
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "faqs: public read active" on public.faqs
for select to anon, authenticated
using (is_active);

create policy "faqs: admin all" on public.faqs
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Customer-owned data
-- ---------------------------------------------------------------------------
create policy "addresses: owner select" on public.addresses
for select to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "addresses: owner insert" on public.addresses
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "addresses: owner update" on public.addresses
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "addresses: owner delete" on public.addresses
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "wishlists: owner select" on public.wishlists
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "wishlists: owner insert" on public.wishlists
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "wishlists: owner delete" on public.wishlists
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "carts: owner read" on public.carts
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "cart_items: owner read" on public.cart_items
for select to authenticated
using (exists (
  select 1 from public.carts c
  where c.id = cart_id and c.user_id = (select auth.uid())
));

-- ---------------------------------------------------------------------------
-- Orders and related records (read own; admin read all; admin limited update)
-- ---------------------------------------------------------------------------
create policy "orders: owner or admin read" on public.orders
for select to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "orders: admin update" on public.orders
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "order_items: owner or admin read" on public.order_items
for select to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))
));

create policy "order_events: owner or admin read" on public.order_events
for select to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))
));

create policy "payments: owner or admin read" on public.payments
for select to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))
));

create policy "shipments: owner or admin read" on public.shipments
for select to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))
));

create policy "shipping_events: owner or admin read" on public.shipping_events
for select to authenticated
using (exists (
  select 1 from public.shipments s
  join public.orders o on o.id = s.order_id
  where s.id = shipment_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))
));

create policy "coupon_usage: admin read" on public.coupon_usage
for select to authenticated
using ((select public.is_admin()));

create policy "coupons: admin all" on public.coupons
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Reviews: public sees approved; authors see their own; admins moderate.
-- Inserts happen on the server (verified purchase + moderation are computed there).
-- ---------------------------------------------------------------------------
create policy "reviews: public read approved" on public.reviews
for select to anon, authenticated
using (status = 'approved');

create policy "reviews: author read own" on public.reviews
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "reviews: admin read all" on public.reviews
for select to authenticated
using ((select public.is_admin()));

create policy "reviews: admin update" on public.reviews
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "reviews: admin delete" on public.reviews
for delete to authenticated
using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Admin inbox
-- ---------------------------------------------------------------------------
create policy "contact_messages: admin read" on public.contact_messages
for select to authenticated
using ((select public.is_admin()));

create policy "contact_messages: admin update" on public.contact_messages
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "newsletter: admin read" on public.newsletter_subscribers
for select to authenticated
using ((select public.is_admin()));

-- webhook_events and rate_limits: RLS on, no policies => service role only.
