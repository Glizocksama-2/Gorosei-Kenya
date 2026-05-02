-- Row-level security for the storefront.
-- Public users can read available storefront data and submit forms.
-- Authenticated users can manage admin data through the admin UI.

alter table public.collections enable row level security;
alter table public."products for Gorosei" enable row level security;
alter table public.drops enable row level security;
alter table public.waitlist enable row level security;
alter table public.newsletter enable row level security;
alter table public.admin_users enable row level security;
alter table public.orders enable row level security;
alter table public.product_events enable row level security;

grant usage on schema public to anon, authenticated;

grant select on public.collections to anon, authenticated;
grant select on public."products for Gorosei" to anon, authenticated;
grant select on public.drops to anon, authenticated;
grant insert on public.waitlist to anon, authenticated;
grant insert on public.newsletter to anon, authenticated;
grant insert on public.orders to anon, authenticated;
grant insert on public.product_events to anon, authenticated;

grant select, insert, update, delete on public.collections to authenticated;
grant select, insert, update, delete on public."products for Gorosei" to authenticated;
grant select, insert, update, delete on public.drops to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, delete on public.product_events to authenticated;
grant select on public.waitlist to authenticated;
grant select on public.newsletter to authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists "Admins can read own admin row" on public.admin_users;
drop policy if exists "Public can read active collections" on public.collections;
drop policy if exists "Admins can manage collections" on public.collections;
drop policy if exists "Public can read available products" on public."products for Gorosei";
drop policy if exists "Public can read storefront products" on public."products for Gorosei";
drop policy if exists "Admins can manage products" on public."products for Gorosei";
drop policy if exists "Public can read active drops" on public.drops;
drop policy if exists "Admins can manage drops" on public.drops;
drop policy if exists "Public can join waitlist" on public.waitlist;
drop policy if exists "Admins can read waitlist" on public.waitlist;
drop policy if exists "Public can join newsletter" on public.newsletter;
drop policy if exists "Admins can read newsletter" on public.newsletter;
drop policy if exists "Public can create order leads" on public.orders;
drop policy if exists "Admins can manage orders" on public.orders;
drop policy if exists "Public can write product events" on public.product_events;
drop policy if exists "Admins can read product events" on public.product_events;

create policy "Admins can read own admin row"
on public.admin_users
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Public can read active collections"
on public.collections
for select
to anon
using (active = true);

create policy "Admins can manage collections"
on public.collections
for all
to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

create policy "Public can read storefront products"
on public."products for Gorosei"
for select
to anon
using (true);

create policy "Admins can manage products"
on public."products for Gorosei"
for all
to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

create policy "Public can read active drops"
on public.drops
for select
to anon
using (active = true);

create policy "Admins can manage drops"
on public.drops
for all
to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

create policy "Public can join waitlist"
on public.waitlist
for insert
to anon, authenticated
with check (
  phone ~ '^[0-9]{7,15}$'
  and (
    drop_id is null
    or exists (select 1 from public.drops where id = drop_id and active = true)
  )
);

create policy "Admins can read waitlist"
on public.waitlist
for select
to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

create policy "Public can join newsletter"
on public.newsletter
for insert
to anon, authenticated
with check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$');

create policy "Admins can read newsletter"
on public.newsletter
for select
to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

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
