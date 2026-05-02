-- Business growth layer: richer product trust fields, order capture, and storefront analytics.

alter table public."products for Gorosei"
  add column if not exists condition text default 'thrifted',
  add column if not exists fit_notes text,
  add column if not exists story text;

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

alter table public.orders enable row level security;
alter table public.product_events enable row level security;

grant select, insert, update, delete on public.orders to authenticated;
grant insert on public.orders to anon, authenticated;
grant select, insert, delete on public.product_events to authenticated;
grant insert on public.product_events to anon, authenticated;

drop policy if exists "Public can create order leads" on public.orders;
drop policy if exists "Admins can manage orders" on public.orders;
drop policy if exists "Public can write product events" on public.product_events;
drop policy if exists "Admins can read product events" on public.product_events;

create policy "Public can create order leads"
on public.orders
for insert
to anon, authenticated
with check (
  phone ~ '^[0-9]{7,15}$'
  and status = 'new'
);

create policy "Admins can manage orders"
on public.orders
for all
to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

create policy "Public can write product events"
on public.product_events
for insert
to anon, authenticated
with check (event_type in ('view', 'whatsapp_order', 'whatsapp_order_fallback'));

create policy "Admins can read product events"
on public.product_events
for select
to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
