-- Core schema for the Gorosei Kenya mtumba streetwear store.

create extension if not exists pgcrypto;

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists collections_name_unique_idx
  on public.collections (lower(name));

create table if not exists public."products for Gorosei" (
  id uuid primary key default gen_random_uuid(),
  "Name" text not null,
  "Price" integer not null default 2000 check ("Price" >= 0),
  original_price integer check (original_price is null or original_price >= 0),
  category text not null default 'tshirts'
    check (category in ('tshirts', 'jackets', 'pants', 'accessories', 'shoes', 'socks')),
  size text not null default 'M'
    check (size in ('S', 'M', 'L', 'XL')),
  "Image_url" text not null,
  "Image_urls" text[] not null default array[]::text[],
  condition text default 'thrifted',
  fit_notes text,
  story text,
  collection_id uuid references public.collections(id) on delete set null,
  sold boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.drops (
  id uuid primary key default gen_random_uuid(),
  collection_name text not null,
  drop_date timestamptz not null,
  active boolean not null default false,
  locked boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists one_active_drop
  on public.drops (active)
  where active = true;

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  drop_id uuid references public.drops(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_drop_id_idx on public.waitlist(drop_id);
create index if not exists products_collection_id_idx on public."products for Gorosei"(collection_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public."products for Gorosei"(id) on delete set null,
  product_name text not null,
  customer_name text,
  phone text not null,
  selected_size text,
  price integer,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'paid', 'delivered', 'cancelled')),
  source text not null default 'product_page',
  created_at timestamptz not null default now()
);

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public."products for Gorosei"(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists product_events_product_id_idx on public.product_events(product_id);
create index if not exists product_events_type_idx on public.product_events(event_type);

create table if not exists public.newsletter (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
