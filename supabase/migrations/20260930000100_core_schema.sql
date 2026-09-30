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
