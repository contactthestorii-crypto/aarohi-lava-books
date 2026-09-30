-- Commerce schema: addresses, carts, coupons, orders, payments, shipments, reviews,
-- wishlists, webhook idempotency, rate limiting, contact and newsletter.

create type public.order_status as enum (
  'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY',
  'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURN_REQUESTED', 'RETURNED'
);
create type public.payment_method as enum ('online', 'cod');
create type public.payment_status as enum (
  'created', 'captured', 'failed', 'refunded', 'partially_refunded', 'cod_pending', 'cod_collected'
);
create type public.inventory_state as enum ('none', 'reserved', 'committed', 'released');
create type public.coupon_type as enum ('percent', 'fixed');
create type public.review_status as enum ('pending', 'approved', 'hidden');

-- ---------------------------------------------------------------------------
-- Addresses
-- ---------------------------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  line1 text not null check (char_length(line1) between 3 and 200),
  line2 text check (char_length(line2) <= 200),
  area text check (char_length(area) <= 120),
  city text not null check (char_length(city) between 2 and 80),
  state text not null check (char_length(state) between 2 and 80),
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  landmark text check (char_length(landmark) <= 120),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_user_idx on public.addresses (user_id);
create unique index addresses_one_default_per_user on public.addresses (user_id) where is_default;

create trigger addresses_set_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Carts (server-side; guests identified by an httpOnly cookie holding the cart id)
-- ---------------------------------------------------------------------------
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index carts_updated_idx on public.carts (updated_at) where user_id is null;

create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

create table public.cart_items (
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null check (quantity between 1 and 20),
  added_at timestamptz not null default now(),
  primary key (cart_id, product_id)
);

create index cart_items_product_idx on public.cart_items (product_id);

-- ---------------------------------------------------------------------------
-- Coupons
-- ---------------------------------------------------------------------------
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{3,32}$'),
  description text check (char_length(description) <= 300),
  type public.coupon_type not null,
  value integer not null check (value > 0),
  max_discount_paise integer check (max_discount_paise > 0),
  min_order_paise integer not null default 0 check (min_order_paise >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  max_uses integer check (max_uses > 0),
  per_customer_limit integer check (per_customer_limit > 0),
  applies_to text not null default 'all' check (applies_to in ('all', 'products', 'categories')),
  product_ids uuid[] not null default '{}',
  category_ids uuid[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_percent_range check (type <> 'percent' or value <= 100),
  constraint coupons_window check (expires_at is null or starts_at is null or expires_at > starts_at)
);

create trigger coupons_set_updated_at
before update on public.coupons
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  access_token uuid not null default gen_random_uuid(),
  idempotency_key text unique check (char_length(idempotency_key) <= 100),
  user_id uuid references public.profiles (id) on delete set null,
  status public.order_status not null,
  payment_method public.payment_method not null,
  payment_status public.payment_status not null,
  inventory_state public.inventory_state not null default 'none',
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_email text not null check (char_length(customer_email) between 3 and 254),
  customer_phone text not null check (customer_phone ~ '^[6-9][0-9]{9}$'),
  shipping_address jsonb not null,
  shipping_pincode text not null check (shipping_pincode ~ '^[1-9][0-9]{5}$'),
  shipping_method text not null default 'standard',
  subtotal_paise integer not null check (subtotal_paise >= 0),
  discount_paise integer not null default 0 check (discount_paise >= 0),
  shipping_paise integer not null default 0 check (shipping_paise >= 0),
  cod_fee_paise integer not null default 0 check (cod_fee_paise >= 0),
  tax_paise integer not null default 0 check (tax_paise >= 0),
  total_paise integer not null check (total_paise >= 0),
  tax_rate_bps integer not null default 0 check (tax_rate_bps between 0 and 10000),
  prices_include_tax boolean not null default true,
  coupon_id uuid references public.coupons (id) on delete set null,
  coupon_code text,
  customer_note text check (char_length(customer_note) <= 500),
  admin_note text check (char_length(admin_note) <= 2000),
  cancel_reason text,
  needs_attention boolean not null default false,
  expires_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_created_idx on public.orders (created_at desc);
create index orders_phone_idx on public.orders (customer_phone);
create index orders_email_idx on public.orders (lower(customer_email));
create index orders_pending_expiry_idx on public.orders (expires_at) where status = 'PENDING_PAYMENT';

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  title text not null,
  slug text,
  sku text,
  isbn text,
  cover_url text,
  unit_price_paise integer not null check (unit_price_paise >= 0),
  unit_mrp_paise integer check (unit_mrp_paise >= 0),
  quantity integer not null check (quantity between 1 and 100),
  line_total_paise integer not null check (line_total_paise >= 0),
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

-- Timeline of status changes and notes, shown to customers (public_note) and admins.
create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status,
  message text,
  actor text not null default 'system' check (actor in ('system', 'customer', 'admin', 'payment', 'shipping')),
  created_at timestamptz not null default now()
);

create index order_events_order_idx on public.order_events (order_id, created_at);

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null,
  method public.payment_method not null,
  status public.payment_status not null,
  amount_paise integer not null check (amount_paise >= 0),
  currency text not null default 'INR',
  provider_order_id text,
  provider_payment_id text,
  refunded_paise integer not null default 0 check (refunded_paise >= 0),
  error_code text,
  error_description text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_order_id),
  unique (provider, provider_payment_id)
);

create index payments_order_idx on public.payments (order_id);

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Shipments and tracking events
-- ---------------------------------------------------------------------------
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null,
  provider_order_id text,
  provider_shipment_id text,
  awb text,
  courier_name text,
  tracking_url text,
  status public.order_status,
  provider_status text,
  estimated_delivery timestamptz,
  label_url text,
  is_active boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shipments_order_idx on public.shipments (order_id);
create unique index shipments_provider_awb_idx on public.shipments (provider, awb) where awb is not null;
create unique index shipments_one_active_per_order on public.shipments (order_id) where is_active;

create trigger shipments_set_updated_at
before update on public.shipments
for each row execute function public.set_updated_at();

create table public.shipping_events (
  id bigint generated always as identity primary key,
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  provider_status text not null,
  mapped_status public.order_status,
  location text,
  description text,
  occurred_at timestamptz not null,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (shipment_id, provider_status, occurred_at)
);

create index shipping_events_shipment_idx on public.shipping_events (shipment_id, occurred_at);

-- ---------------------------------------------------------------------------
-- Coupon usage (recorded when an order is paid, or placed for COD)
-- ---------------------------------------------------------------------------
create table public.coupon_usage (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  order_id uuid not null unique references public.orders (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  customer_email text not null,
  customer_phone text not null,
  discount_paise integer not null check (discount_paise >= 0),
  created_at timestamptz not null default now()
);

create index coupon_usage_coupon_idx on public.coupon_usage (coupon_id);
create index coupon_usage_customer_idx on public.coupon_usage (coupon_id, lower(customer_email));

-- ---------------------------------------------------------------------------
-- Reviews and wishlists
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text check (char_length(title) <= 120),
  body text check (char_length(body) <= 3000),
  author_name text not null check (char_length(author_name) between 1 and 80),
  status public.review_status not null default 'pending',
  verified_purchase boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index reviews_product_status_idx on public.reviews (product_id, status, created_at desc);

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

create table public.wishlists (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Infrastructure tables (service role only)
-- ---------------------------------------------------------------------------
create table public.webhook_events (
  id bigint generated always as identity primary key,
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 254),
  phone text check (phone is null or phone ~ '^[6-9][0-9]{9}$'),
  subject text check (char_length(subject) <= 160),
  message text not null check (char_length(message) between 5 and 4000),
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254),
  created_at timestamptz not null default now()
);

create unique index newsletter_email_idx on public.newsletter_subscribers (lower(email));
