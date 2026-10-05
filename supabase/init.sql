-- Core catalog schema: profiles, categories, products, images, inventory, settings, content.
-- See docs/ARCHITECTURE.md. Money is stored in paise (integer).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'admin');
create type public.product_status as enum ('draft', 'published', 'archived');
create type public.category_kind as enum ('exam', 'subject', 'type');

-- ---------------------------------------------------------------------------
-- Shared trigger: updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text check (char_length(full_name) <= 120),
  phone text check (phone is null or phone ~ '^[6-9][0-9]{9}$'),
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role) where role = 'admin';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Create a profile row whenever a user signs up. Role is never taken from user metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 1000),
  kind public.category_kind not null default 'subject',
  parent_id uuid references public.categories (id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  seo_title text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_kind_sort_idx on public.categories (kind, sort_order) where is_active;

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Products (books)
-- Nullable fields are facts the publisher has not supplied yet (docs/PRD.md content rules).
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 200),
  subtitle text check (char_length(subtitle) <= 300),
  author text check (char_length(author) <= 200),
  author_bio text check (char_length(author_bio) <= 3000),
  description text check (char_length(description) <= 20000),
  key_features text[] not null default '{}',
  contents text[] not null default '{}',
  exam_coverage text[] not null default '{}',
  exams text[] not null default '{}',
  keywords text[] not null default '{}',
  sku text unique check (char_length(sku) <= 64),
  isbn text unique check (isbn is null or isbn ~ '^[0-9Xx-]{10,17}$'),
  publisher text check (char_length(publisher) <= 200),
  edition text check (char_length(edition) <= 100),
  publication_year integer check (publication_year between 1900 and 2100),
  pages integer check (pages > 0),
  language text check (char_length(language) <= 60),
  dimensions text check (char_length(dimensions) <= 100),
  weight_grams integer check (weight_grams > 0),
  binding text check (char_length(binding) <= 60),
  mrp_paise integer check (mrp_paise >= 0),
  price_paise integer check (price_paise >= 0),
  status public.product_status not null default 'draft',
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  primary_category_id uuid references public.categories (id) on delete set null,
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  seo_title text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  search_vector tsvector,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_price_not_above_mrp check (
    price_paise is null or mrp_paise is null or price_paise <= mrp_paise
  )
);

create index products_status_published_idx on public.products (status, published_at desc);
create index products_featured_idx on public.products (is_featured) where status = 'published' and is_featured;
create index products_bestseller_idx on public.products (is_bestseller) where status = 'published' and is_bestseller;
create index products_search_idx on public.products using gin (search_vector);
create index products_exams_idx on public.products using gin (exams);
create index products_primary_category_idx on public.products (primary_category_id);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Maintain the full text search vector (simple config: mixed English / transliterated terms).
create or replace function public.products_search_vector_refresh()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.isbn, '') || ' ' || coalesce(replace(new.isbn, '-', ''), '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.subtitle, '') || ' ' || coalesce(new.author, '')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(new.exams, ' ') || ' ' || array_to_string(new.keywords, ' ')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.publisher, '') || ' ' || array_to_string(new.exam_coverage, ' ')), 'C') ||
    setweight(to_tsvector('simple', left(coalesce(new.description, ''), 4000)), 'D');
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger products_search_vector
before insert or update on public.products
for each row execute function public.products_search_vector_refresh();

-- Many-to-many product <-> category
create table public.product_categories (
  product_id uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (product_id, category_id)
);

create index product_categories_category_idx on public.product_categories (category_id);

-- ---------------------------------------------------------------------------
-- Product images
-- ---------------------------------------------------------------------------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null check (char_length(url) <= 1000),
  storage_path text,
  alt text check (char_length(alt) <= 200),
  width integer check (width > 0),
  height integer check (height > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- Inventory (server-controlled; changed through functions in a later migration)
-- ---------------------------------------------------------------------------
create table public.inventory (
  product_id uuid primary key references public.products (id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  allow_backorder boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint inventory_reserved_within_stock check (allow_backorder or reserved <= quantity)
);

create trigger inventory_set_updated_at
before update on public.inventory
for each row execute function public.set_updated_at();

-- Every product gets an inventory row (quantity 0 until the admin sets stock).
create or replace function public.products_create_inventory()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.inventory (product_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger products_create_inventory
after insert on public.products
for each row execute function public.products_create_inventory();

-- ---------------------------------------------------------------------------
-- Store settings (non-secret, public-readable key/value)
-- ---------------------------------------------------------------------------
create table public.settings (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger settings_set_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Website content: banners and FAQs
-- ---------------------------------------------------------------------------
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  placement text not null check (placement in ('announcement', 'hero', 'promo')),
  title text not null check (char_length(title) between 1 and 160),
  subtitle text check (char_length(subtitle) <= 300),
  image_url text check (char_length(image_url) <= 1000),
  link_url text check (char_length(link_url) <= 500),
  link_label text check (char_length(link_label) <= 40),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint banners_window check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index banners_placement_idx on public.banners (placement, sort_order) where is_active;

create trigger banners_set_updated_at
before update on public.banners
for each row execute function public.set_updated_at();

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 1 and 300),
  answer text not null check (char_length(answer) between 1 and 3000),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger faqs_set_updated_at
before update on public.faqs
for each row execute function public.set_updated_at();
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
-- Transactional business functions. Callable only by the service role unless stated.
-- See docs/ARCHITECTURE.md (Inventory, Payments flow) and docs/DECISIONS.md ADR-005.

-- ---------------------------------------------------------------------------
-- Order timeline + timestamps
-- Functions set app.event_message / app.event_actor before changing status so the
-- trigger can record a meaningful event. Direct admin updates fall back to defaults.
-- ---------------------------------------------------------------------------
create or replace function public.orders_status_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'DELIVERED' and new.delivered_at is null then
      new.delivered_at := now();
    end if;
    if new.status = 'CANCELLED' and new.cancelled_at is null then
      new.cancelled_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger orders_status_timestamps
before update of status on public.orders
for each row execute function public.orders_status_timestamps();

create or replace function public.orders_record_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message text := nullif(current_setting('app.event_message', true), '');
  v_actor text := coalesce(nullif(current_setting('app.event_actor', true), ''), 'system');
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, status, message, actor)
    values (new.id, new.status, coalesce(v_message, 'Order placed'), v_actor);
  elsif new.status is distinct from old.status then
    if v_actor not in ('system', 'customer', 'admin', 'payment', 'shipping') then
      v_actor := 'system';
    end if;
    insert into public.order_events (order_id, status, message, actor)
    values (new.id, new.status, v_message, v_actor);
  end if;
  return null;
end;
$$;

revoke execute on function public.orders_record_event() from public, anon, authenticated;

create trigger orders_record_event
after insert or update of status on public.orders
for each row execute function public.orders_record_event();

create or replace function public._set_event_context(p_message text, p_actor text)
returns void
language sql
set search_path = ''
as $$
  select set_config('app.event_message', coalesce(p_message, ''), true),
         set_config('app.event_actor', coalesce(p_actor, 'system'), true);
$$;

-- ---------------------------------------------------------------------------
-- Inventory helpers (internal)
-- ---------------------------------------------------------------------------

-- Moves reserved units to sold: quantity -= q, reserved -= q.
create or replace function public._commit_reserved_inventory(p_order_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.inventory i
  set quantity = greatest(i.quantity - x.qty, 0),
      reserved = greatest(i.reserved - x.qty, 0)
  from (
    select product_id, sum(quantity)::int as qty
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) x
  where i.product_id = x.product_id;
end;
$$;

-- Returns reserved units to available stock.
create or replace function public._release_reserved_inventory(p_order_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.inventory i
  set reserved = greatest(i.reserved - x.qty, 0)
  from (
    select product_id, sum(quantity)::int as qty
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) x
  where i.product_id = x.product_id;
end;
$$;

-- Puts sold units back on the shelf (cancellation/return after commit).
create or replace function public._restock_committed_inventory(p_order_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.inventory i
  set quantity = i.quantity + x.qty
  from (
    select product_id, sum(quantity)::int as qty
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) x
  where i.product_id = x.product_id;
end;
$$;

-- Tries to take stock directly (used when a payment arrives after the reservation expired).
-- Returns false if any line cannot be fulfilled; lines that can are still taken.
create or replace function public._take_inventory_now(p_order_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_line record;
  v_ok boolean := true;
  v_rows integer;
begin
  for v_line in
    select product_id, sum(quantity)::int as qty
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  loop
    update public.inventory
    set quantity = quantity - v_line.qty
    where product_id = v_line.product_id and quantity - reserved >= v_line.qty;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      v_ok := false;
    end if;
  end loop;
  return v_ok;
end;
$$;

create or replace function public._record_coupon_usage(p_order_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.coupon_usage (coupon_id, order_id, user_id, customer_email, customer_phone, discount_paise)
  select o.coupon_id, o.id, o.user_id, lower(o.customer_email), o.customer_phone, o.discount_paise
  from public.orders o
  where o.id = p_order_id and o.coupon_id is not null
  on conflict (order_id) do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- place_order: inserts order + items and reserves stock in one transaction.
-- Amounts are computed by the server (src/services/pricing.ts) from DB prices; this
-- function re-checks each unit price against the product row to catch races.
-- Idempotent on idempotency_key.
-- ---------------------------------------------------------------------------
create or replace function public.place_order(p_order jsonb, p_items jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_existing public.orders%rowtype;
  v_order_id uuid;
  v_access_token uuid;
  v_order_number text;
  v_method public.payment_method := (p_order ->> 'payment_method')::public.payment_method;
  v_item jsonb;
  v_qty integer;
  v_product public.products%rowtype;
  v_rows integer;
  v_attempt integer := 0;
  v_status public.order_status;
begin
  if nullif(p_order ->> 'idempotency_key', '') is not null then
    select * into v_existing from public.orders where idempotency_key = p_order ->> 'idempotency_key';
    if found then
      return jsonb_build_object(
        'id', v_existing.id, 'order_number', v_existing.order_number,
        'access_token', v_existing.access_token, 'status', v_existing.status,
        'total_paise', v_existing.total_paise, 'created', false
      );
    end if;
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;

  loop
    v_order_number := 'AL' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-'
      || upper(substr(md5(gen_random_uuid()::text), 1, 5));
    exit when not exists (select 1 from public.orders where order_number = v_order_number);
    v_attempt := v_attempt + 1;
    if v_attempt > 5 then
      raise exception 'ORDER_NUMBER_COLLISION' using errcode = 'P0001';
    end if;
  end loop;

  v_status := case when v_method = 'cod' then 'PROCESSING' else 'PENDING_PAYMENT' end;

  perform public._set_event_context(
    case when v_method = 'cod' then 'Order placed (cash on delivery)' else 'Order placed, awaiting payment' end,
    'customer'
  );

  insert into public.orders (
    order_number, idempotency_key, user_id, status, payment_method, payment_status, inventory_state,
    customer_name, customer_email, customer_phone, shipping_address, shipping_pincode, shipping_method,
    subtotal_paise, discount_paise, shipping_paise, cod_fee_paise, tax_paise, total_paise,
    tax_rate_bps, prices_include_tax, coupon_id, coupon_code, customer_note, expires_at
  ) values (
    v_order_number,
    nullif(p_order ->> 'idempotency_key', ''),
    nullif(p_order ->> 'user_id', '')::uuid,
    v_status,
    v_method,
    case when v_method = 'cod' then 'cod_pending'::public.payment_status else 'created'::public.payment_status end,
    'reserved',
    p_order ->> 'customer_name',
    lower(p_order ->> 'customer_email'),
    p_order ->> 'customer_phone',
    p_order -> 'shipping_address',
    p_order ->> 'shipping_pincode',
    coalesce(p_order ->> 'shipping_method', 'standard'),
    (p_order ->> 'subtotal_paise')::integer,
    coalesce((p_order ->> 'discount_paise')::integer, 0),
    coalesce((p_order ->> 'shipping_paise')::integer, 0),
    coalesce((p_order ->> 'cod_fee_paise')::integer, 0),
    coalesce((p_order ->> 'tax_paise')::integer, 0),
    (p_order ->> 'total_paise')::integer,
    coalesce((p_order ->> 'tax_rate_bps')::integer, 0),
    coalesce((p_order ->> 'prices_include_tax')::boolean, true),
    nullif(p_order ->> 'coupon_id', '')::uuid,
    nullif(p_order ->> 'coupon_code', ''),
    nullif(p_order ->> 'customer_note', ''),
    case when v_method = 'online'
      then now() + make_interval(mins => coalesce((p_order ->> 'payment_window_minutes')::integer, 30))
    end
  )
  returning id, access_token into v_order_id, v_access_token;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 then
      raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
    end if;

    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid for share;
    if not found or v_product.status <> 'published' then
      raise exception 'PRODUCT_UNAVAILABLE:%', v_item ->> 'product_id' using errcode = 'P0001';
    end if;
    if v_product.price_paise is null or v_product.price_paise <> (v_item ->> 'unit_price_paise')::integer then
      raise exception 'PRICE_CHANGED:%', v_product.id using errcode = 'P0001';
    end if;

    update public.inventory
    set reserved = reserved + v_qty
    where product_id = v_product.id and (allow_backorder or quantity - reserved >= v_qty);
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      raise exception 'INSUFFICIENT_STOCK:%', v_product.id using errcode = 'P0001';
    end if;

    insert into public.order_items (
      order_id, product_id, title, slug, sku, isbn, cover_url,
      unit_price_paise, unit_mrp_paise, quantity, line_total_paise
    ) values (
      v_order_id, v_product.id, v_product.title, v_product.slug, v_product.sku, v_product.isbn,
      nullif(v_item ->> 'cover_url', ''),
      v_product.price_paise, v_product.mrp_paise, v_qty, v_product.price_paise * v_qty
    );
  end loop;

  if v_method = 'cod' then
    perform public._commit_reserved_inventory(v_order_id);
    update public.orders set inventory_state = 'committed' where id = v_order_id;
    perform public._record_coupon_usage(v_order_id);
  end if;

  insert into public.payments (order_id, provider, method, status, amount_paise)
  values (
    v_order_id,
    case when v_method = 'cod' then 'cod' else coalesce(p_order ->> 'payment_provider', 'razorpay') end,
    v_method,
    case when v_method = 'cod' then 'cod_pending'::public.payment_status else 'created'::public.payment_status end,
    (p_order ->> 'total_paise')::integer
  );

  return jsonb_build_object(
    'id', v_order_id, 'order_number', v_order_number, 'access_token', v_access_token,
    'status', v_status, 'total_paise', (p_order ->> 'total_paise')::integer, 'created', true
  );
end;
$$;

-- Links the gateway's order id to our payment row (called after the gateway order is created).
create or replace function public.attach_provider_order(p_order_id uuid, p_provider text, p_provider_order_id text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.payments
  set provider = p_provider, provider_order_id = p_provider_order_id
  where order_id = p_order_id and method = 'online' and status in ('created', 'failed')
    and (provider_order_id is null or provider_order_id = p_provider_order_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- finalize_paid_order: idempotent. Safe to call from both the browser callback and the
-- webhook; only the first call changes state.
-- ---------------------------------------------------------------------------
create or replace function public.finalize_paid_order(
  p_order_id uuid,
  p_provider text,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_amount_paise integer,
  p_raw jsonb default null
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_stock_ok boolean := true;
  v_rows integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  update public.payments
  set status = 'captured',
      provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
      amount_paise = p_amount_paise,
      raw = coalesce(p_raw, raw),
      error_code = null,
      error_description = null
  where order_id = p_order_id and provider = p_provider and provider_order_id = p_provider_order_id
    and status <> 'refunded';
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    insert into public.payments (order_id, provider, method, status, amount_paise, provider_order_id, provider_payment_id, raw)
    values (p_order_id, p_provider, 'online', 'captured', p_amount_paise, p_provider_order_id, p_provider_payment_id, p_raw)
    on conflict do nothing;
  end if;

  if v_order.payment_status = 'captured' then
    return jsonb_build_object('finalized', false, 'reason', 'already_paid', 'status', v_order.status);
  end if;

  if p_amount_paise < v_order.total_paise then
    update public.orders set needs_attention = true,
      admin_note = concat_ws(E'\n', admin_note, 'Captured amount ' || p_amount_paise || ' is below order total ' || v_order.total_paise)
    where id = p_order_id;
    return jsonb_build_object('finalized', false, 'reason', 'amount_mismatch', 'status', v_order.status);
  end if;

  if v_order.inventory_state = 'reserved' then
    perform public._commit_reserved_inventory(p_order_id);
  elsif v_order.inventory_state = 'released' then
    v_stock_ok := public._take_inventory_now(p_order_id);
  end if;

  perform public._set_event_context('Payment confirmed', 'payment');

  update public.orders
  set status = case when status in ('PENDING_PAYMENT', 'CANCELLED') then 'PAID'::public.order_status else status end,
      payment_status = 'captured',
      inventory_state = 'committed',
      paid_at = now(),
      expires_at = null,
      cancel_reason = null,
      cancelled_at = null,
      needs_attention = needs_attention or not v_stock_ok,
      admin_note = case when v_stock_ok then admin_note
        else concat_ws(E'\n', admin_note, 'Paid after reservation expired and stock was insufficient for at least one item.') end
  where id = p_order_id;

  perform public._record_coupon_usage(p_order_id);

  return jsonb_build_object('finalized', true, 'needs_attention', not v_stock_ok, 'status', 'PAID');
end;
$$;

-- Records a failed payment attempt. The order stays PENDING_PAYMENT so the customer can retry.
create or replace function public.mark_payment_failed(
  p_provider text,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_error_code text,
  p_error_description text
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_order_id uuid;
begin
  update public.payments
  set status = 'failed',
      provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
      error_code = left(p_error_code, 100),
      error_description = left(p_error_description, 500)
  where provider = p_provider and provider_order_id = p_provider_order_id and status in ('created', 'failed')
  returning order_id into v_order_id;

  if v_order_id is not null then
    insert into public.order_events (order_id, message, actor)
    values (v_order_id, 'Payment attempt failed', 'payment');
  end if;
  return v_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- cancel_order: releases reservations; optionally restocks committed units.
-- Refunds are handled separately through the payment provider.
-- ---------------------------------------------------------------------------
create or replace function public.cancel_order(p_order_id uuid, p_reason text, p_actor text, p_restock boolean default true)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_new_state public.inventory_state;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_order.status in ('SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURN_REQUESTED', 'RETURNED') then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;

  v_new_state := v_order.inventory_state;
  if v_order.inventory_state = 'reserved' then
    perform public._release_reserved_inventory(p_order_id);
    v_new_state := 'released';
  elsif v_order.inventory_state = 'committed' and p_restock then
    perform public._restock_committed_inventory(p_order_id);
    v_new_state := 'released';
  end if;

  perform public._set_event_context(coalesce(p_reason, 'Order cancelled'), p_actor);

  update public.orders
  set status = 'CANCELLED',
      cancel_reason = left(p_reason, 300),
      inventory_state = v_new_state,
      expires_at = null
  where id = p_order_id;

  return jsonb_build_object('cancelled', true, 'payment_status', v_order.payment_status);
end;
$$;

-- Cancels unpaid online orders whose payment window has passed. Returns the number cancelled.
create or replace function public.expire_pending_orders()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in
    select id from public.orders
    where status = 'PENDING_PAYMENT' and expires_at < now()
    order by expires_at
    limit 500
    for update skip locked
  loop
    perform public.cancel_order(v_id, 'Payment not completed in time', 'system', true);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Records a refund (from the admin action or the payment webhook). Idempotent per refund total.
create or replace function public.record_refund(p_order_id uuid, p_refunded_total_paise integer, p_note text)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_full boolean;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  v_full := p_refunded_total_paise >= v_order.total_paise;

  update public.payments
  set refunded_paise = greatest(refunded_paise, p_refunded_total_paise),
      status = case when v_full then 'refunded'::public.payment_status else 'partially_refunded'::public.payment_status end
  where order_id = p_order_id and method = 'online' and status in ('captured', 'partially_refunded', 'refunded');

  update public.orders
  set payment_status = case when v_full then 'refunded'::public.payment_status else 'partially_refunded'::public.payment_status end
  where id = p_order_id;

  if v_full and v_order.status <> 'REFUNDED' then
    perform public._set_event_context(coalesce(p_note, 'Refund processed'), 'payment');
    update public.orders set status = 'REFUNDED' where id = p_order_id;
  else
    insert into public.order_events (order_id, message, actor)
    values (p_order_id, coalesce(p_note, 'Partial refund processed'), 'payment');
  end if;

  return jsonb_build_object('full', v_full);
end;
$$;

-- Status change with a timeline message (used by admin and shipping sync on the server).
create or replace function public.set_order_status(p_order_id uuid, p_status public.order_status, p_message text, p_actor text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform public._set_event_context(p_message, p_actor);
  update public.orders set status = p_status where id = p_order_id and status is distinct from p_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- Rate limiting (fixed window). Returns true when the call is allowed.
-- ---------------------------------------------------------------------------
create or replace function public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (left(p_key, 200), v_window, 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1
  returning count into v_count;

  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_limit;
end;
$$;

-- ---------------------------------------------------------------------------
-- Search (security invoker: RLS applies, so only published products are returned)
-- ---------------------------------------------------------------------------
create or replace function public.search_product_ids(p_query text, p_limit integer default 12, p_offset integer default 0)
returns table (product_id uuid, rank real, total_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with cleaned as (
    select trim(regexp_replace(lower(coalesce(p_query, '')), '[^[:alnum:][:space:]]+', ' ', 'g')) as text
  ),
  q as (
    select
      case when c.text = '' then null
        else to_tsquery('simple', (
          select string_agg(quote_literal(w) || ':*', ' & ')
          from regexp_split_to_table(c.text, '\s+') as w
          where w <> ''
        ))
      end as tsq,
      '%' || c.text || '%' as pattern,
      regexp_replace(coalesce(p_query, ''), '[^0-9Xx]', '', 'g') as isbn_digits
    from cleaned c
  ),
  matches as (
    select
      p.id,
      coalesce(ts_rank(p.search_vector, q.tsq), 0)
        + case when lower(p.title) like q.pattern then 1 else 0 end as rank
    from public.products p cross join q
    where p.status = 'published'
      and q.tsq is not null
      and (
        p.search_vector @@ q.tsq
        or lower(p.title) like q.pattern
        or lower(coalesce(p.author, '')) like q.pattern
        or (length(q.isbn_digits) >= 10 and replace(coalesce(p.isbn, ''), '-', '') = q.isbn_digits)
        or exists (
          select 1 from public.product_categories pc
          join public.categories c on c.id = pc.category_id
          where pc.product_id = p.id and lower(c.name) like q.pattern
        )
      )
  )
  select m.id, m.rank::real, count(*) over ()
  from matches m
  order by m.rank desc, m.id
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$$;

-- ---------------------------------------------------------------------------
-- Ratings: keep products.rating_avg / rating_count in sync with approved reviews
-- ---------------------------------------------------------------------------
create or replace function public.reviews_refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
  set rating_avg = coalesce(r.avg_rating, 0),
      rating_count = coalesce(r.cnt, 0)
  from (
    select round(avg(rating)::numeric, 2) as avg_rating, count(*)::int as cnt
    from public.reviews
    where product_id = v_product and status = 'approved'
  ) r
  where p.id = v_product;
  return null;
end;
$$;

revoke execute on function public.reviews_refresh_product_rating() from public, anon, authenticated;

create trigger reviews_refresh_product_rating
after insert or update or delete on public.reviews
for each row execute function public.reviews_refresh_product_rating();

-- ---------------------------------------------------------------------------
-- Admin analytics (service role)
-- ---------------------------------------------------------------------------
create or replace function public.sales_summary(p_since timestamptz)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'revenue_paise', coalesce(sum(total_paise) filter (
      where status in ('PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED')), 0),
    'orders', count(*) filter (where status <> 'PENDING_PAYMENT' and status <> 'CANCELLED'),
    'pending_payment', count(*) filter (where status = 'PENDING_PAYMENT'),
    'paid', count(*) filter (where status = 'PAID'),
    'processing', count(*) filter (where status in ('PROCESSING', 'PACKED')),
    'shipped', count(*) filter (where status in ('SHIPPED', 'OUT_FOR_DELIVERY')),
    'delivered', count(*) filter (where status = 'DELIVERED'),
    'cancelled', count(*) filter (where status = 'CANCELLED'),
    'needs_attention', count(*) filter (where needs_attention)
  )
  from public.orders
  where created_at >= p_since;
$$;

create or replace function public.daily_revenue(p_days integer)
returns table (day date, revenue_paise bigint, orders bigint)
language sql
stable
set search_path = ''
as $$
  select d::date as day,
         coalesce(sum(o.total_paise), 0)::bigint,
         count(o.id)::bigint
  from generate_series(
    (now() at time zone 'Asia/Kolkata')::date - (p_days - 1),
    (now() at time zone 'Asia/Kolkata')::date,
    interval '1 day'
  ) d
  left join public.orders o
    on (o.created_at at time zone 'Asia/Kolkata')::date = d::date
   and o.status in ('PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED')
  group by d
  order by d;
$$;

create or replace function public.best_sellers(p_limit integer, p_since timestamptz)
returns table (product_id uuid, title text, units bigint, revenue_paise bigint)
language sql
stable
set search_path = ''
as $$
  select oi.product_id, max(oi.title), sum(oi.quantity)::bigint, sum(oi.line_total_paise)::bigint
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.status in ('PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED')
    and o.created_at >= p_since
    and oi.product_id is not null
  group by oi.product_id
  order by 3 desc
  limit p_limit;
$$;

-- ---------------------------------------------------------------------------
-- Execute permissions
-- ---------------------------------------------------------------------------
revoke execute on function
  public._set_event_context(text, text),
  public._commit_reserved_inventory(uuid),
  public._release_reserved_inventory(uuid),
  public._restock_committed_inventory(uuid),
  public._take_inventory_now(uuid),
  public._record_coupon_usage(uuid),
  public.place_order(jsonb, jsonb),
  public.attach_provider_order(uuid, text, text),
  public.finalize_paid_order(uuid, text, text, text, integer, jsonb),
  public.mark_payment_failed(text, text, text, text, text),
  public.cancel_order(uuid, text, text, boolean),
  public.expire_pending_orders(),
  public.record_refund(uuid, integer, text),
  public.set_order_status(uuid, public.order_status, text, text),
  public.rate_limit_hit(text, integer, integer),
  public.sales_summary(timestamptz),
  public.daily_revenue(integer),
  public.best_sellers(integer, timestamptz),
  public.orders_status_timestamps(),
  public.products_search_vector_refresh(),
  public.products_create_inventory(),
  public.set_updated_at()
from public, anon, authenticated;

grant execute on function
  public.place_order(jsonb, jsonb),
  public.attach_provider_order(uuid, text, text),
  public.finalize_paid_order(uuid, text, text, text, integer, jsonb),
  public.mark_payment_failed(text, text, text, text, text),
  public.cancel_order(uuid, text, text, boolean),
  public.expire_pending_orders(),
  public.record_refund(uuid, integer, text),
  public.set_order_status(uuid, public.order_status, text, text),
  public.rate_limit_hit(text, integer, integer),
  public.sales_summary(timestamptz),
  public.daily_revenue(integer),
  public.best_sellers(integer, timestamptz)
to service_role;

-- Internal helpers are only called from the functions above (which run as the caller);
-- service_role needs execute on them too.
grant execute on function
  public._set_event_context(text, text),
  public._commit_reserved_inventory(uuid),
  public._release_reserved_inventory(uuid),
  public._restock_committed_inventory(uuid),
  public._take_inventory_now(uuid),
  public._record_coupon_usage(uuid)
to service_role;

grant execute on function public.search_product_ids(text, integer, integer) to anon, authenticated, service_role;
-- Product image storage: public read (bucket is public), admin-only writes.
-- Upsert needs INSERT + SELECT + UPDATE policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "product-images: admin select" on storage.objects
for select to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()));

create policy "product-images: admin insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "product-images: admin update" on storage.objects
for update to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()))
with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "product-images: admin delete" on storage.objects
for delete to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()));
-- Initial store data. Only facts visible on the supplied cover or given by the owner.
-- Unknown values (price, MRP, ISBN, pages, weight, dimensions, binding, stock) stay NULL/0
-- until the publisher enters them in the admin (docs/PRD.md content rules).

-- ---------------------------------------------------------------------------
-- Settings (all editable in /admin/settings)
-- ---------------------------------------------------------------------------
insert into public.settings (key, value) values
  ('store', jsonb_build_object(
    'name', 'Aarohi Lava Publications',
    'short_name', 'Aarohi Lava',
    'tagline', 'Books for Telangana competitive exams',
    'support_email', '',
    'support_phone', '',
    'whatsapp', '',
    'address', '',
    'business_hours', ''
  )),
  ('home', jsonb_build_object(
    'hero_title', 'Prepare smarter. Score better.',
    'hero_subtitle', 'Exam-focused books and previous question papers for TSLPRB, TGPSC and other competitive examinations.'
  )),
  -- Shipping fee shown at checkout. Review before launch (admin setup checklist flags this).
  ('shipping', jsonb_build_object(
    'flat_fee_paise', 0,
    'free_above_paise', null,
    'delivery_note', '',
    'reviewed', false
  )),
  ('cod', jsonb_build_object(
    'enabled', false,
    'fee_paise', 0,
    'max_order_paise', null
  )),
  -- Printed books are generally GST-exempt in India; confirm with your CA before enabling.
  ('tax', jsonb_build_object(
    'enabled', false,
    'rate_bps', 0,
    'prices_include_tax', true,
    'label', 'GST',
    'gstin', ''
  )),
  ('checkout', jsonb_build_object(
    'allow_guest', true
  )),
  ('reviews', jsonb_build_object(
    'moderation', true,
    'verified_only', false
  )),
  ('orders', jsonb_build_object(
    'auto_create_shipment', false
  ))
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Categories (owner-provided initial list)
-- ---------------------------------------------------------------------------
insert into public.categories (slug, name, kind, sort_order, description) values
  ('tslprb', 'TSLPRB', 'exam', 10, 'Telangana State Level Police Recruitment Board exams.'),
  ('tgpsc', 'TGPSC', 'exam', 20, 'Telangana Public Service Commission exams.'),
  ('police-exams', 'Police Exams', 'exam', 30, null),
  ('competitive-exams', 'Competitive Exams', 'exam', 40, null),
  ('general-studies', 'General Studies', 'type', 10, null),
  ('previous-question-papers', 'Previous Question Papers', 'type', 20, null),
  ('telangana-history', 'Telangana History', 'subject', 10, null),
  ('telangana-movement', 'Telangana Movement', 'subject', 20, null),
  ('indian-polity', 'Indian Polity', 'subject', 30, null),
  ('economy', 'Economy', 'subject', 40, null),
  ('geography', 'Geography', 'subject', 50, null),
  ('science-technology', 'Science & Technology', 'subject', 60, null),
  ('environment', 'Environment', 'subject', 70, null),
  ('current-affairs', 'Current Affairs', 'subject', 80, null),
  ('telangana-culture', 'Telangana Culture', 'subject', 90, null),
  ('heritage-arts', 'Heritage & Arts', 'subject', 100, null)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Initial product: Target Police (facts from the cover only)
-- ---------------------------------------------------------------------------
insert into public.products (
  slug, title, subtitle, author, author_bio, publisher, edition, exams, keywords,
  description, key_features, exam_coverage, status, is_featured, primary_category_id,
  seo_title, seo_description
) values (
  'target-police-general-studies-tslprb-tgpsc',
  'Target Police: 360Â° Explanation of General Studies',
  'Previous Question Papers',
  'Swathylava Neralla',
  'Swathylava Neralla (MSc, MA) is the author of Target Police.',
  'Aarohi Lava Publications',
  'Updated with 2026 data',
  array['TSLPRB', 'TGPSC'],
  array['police', 'sub inspector', 'SI', 'general studies', 'previous papers', 'PYQ', 'Telangana', 'prelims', 'mains'],
  'Target Police covers all Telangana Sub Inspector previous question papers (Prelims and Mains) with a 360Â° explanation of General Studies. Written for TSLPRB, TGPSC and other competitive exams, and updated with 2026 data.',
  array[
    'All Telangana Sub Inspector previous question papers (Prelims & Mains) explained in 360Â°',
    'Covers the complete TSLPRB syllabus with an exam-oriented approach',
    'Includes Central & State Budgets 2026-27 with key highlights and probable questions',
    'Includes Telangana Socio Economic Survey 2026 with charts, facts and analysis',
    'Includes 2026 Nobel Awards, Padma Awards, Gaddar Awards and other important awards',
    'Answers linked with latest current affairs (reports, surveys, indexes, schemes, committees)',
    'Aspirant friendly: concise, exam-oriented explanations that save time',
    'Previous questions arranged topic-wise',
    'Concept clarity with tables, maps, diagrams and PYQ trends',
    'Useful for TSLPRB, TGPSC and other state and central exams'
  ],
  array[
    'History', 'Telangana Movement', 'Polity', 'Economy', 'Geography', 'Indian Society',
    'Science & Technology', 'Environment & Ecology', 'Current Affairs',
    'Telangana Culture, Heritage & Arts'
  ],
  'published',
  true,
  (select id from public.categories where slug = 'tslprb'),
  'Target Police: General Studies Previous Papers for TSLPRB, TGPSC',
  'All Telangana SI previous question papers (Prelims & Mains) with 360Â° explanations of General Studies. Updated with 2026 data.'
)
on conflict (slug) do nothing;

insert into public.product_categories (product_id, category_id)
select p.id, c.id
from public.products p
join public.categories c on c.slug in (
  'tslprb', 'tgpsc', 'police-exams', 'competitive-exams', 'general-studies', 'previous-question-papers'
)
where p.slug = 'target-police-general-studies-tslprb-tgpsc'
on conflict do nothing;

-- No product photo is seeded: the storefront renders the book from its data until the
-- publisher uploads real product photos in the admin.

-- ---------------------------------------------------------------------------
-- FAQs describing how the store works (editable in /admin/faqs)
-- ---------------------------------------------------------------------------
insert into public.faqs (question, answer, sort_order) values
  ('How do I track my order?',
   'Open Track order and enter your order ID with the phone number or email you used at checkout. Signed-in customers can also see every order under My account.', 10),
  ('Which payment methods can I use?',
   'Online payments are processed securely by Razorpay, which supports UPI, debit and credit cards, net banking and wallets. Cash on delivery is shown at checkout when it is available for your order.', 20),
  ('Do I need an account to order?',
   'No. You can check out as a guest. Creating an account lets you save addresses and see your order history in one place.', 30),
  ('Will I get a confirmation?',
   'Yes. After your order is placed you see a confirmation page with your order ID, and a confirmation email is sent to the address you entered.', 40);
