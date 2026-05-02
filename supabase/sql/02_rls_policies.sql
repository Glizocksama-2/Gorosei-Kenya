-- Row-level security for the storefront.
-- Public users can read available storefront data and submit forms.
-- Authenticated users can manage admin data through the admin UI.

alter table public.collections enable row level security;
alter table public."products for Gorosei" enable row level security;
alter table public.drops enable row level security;
alter table public.waitlist enable row level security;
alter table public.newsletter enable row level security;
alter table public.admin_users enable row level security;

grant usage on schema public to anon, authenticated;

grant select on public.collections to anon, authenticated;
grant select on public."products for Gorosei" to anon, authenticated;
grant select on public.drops to anon, authenticated;
grant insert on public.waitlist to anon, authenticated;
grant insert on public.newsletter to anon, authenticated;

grant select, insert, update, delete on public.collections to authenticated;
grant select, insert, update, delete on public."products for Gorosei" to authenticated;
grant select, insert, update, delete on public.drops to authenticated;
grant select on public.waitlist to authenticated;
grant select on public.newsletter to authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists "Admins can read own admin row" on public.admin_users;
drop policy if exists "Public can read active collections" on public.collections;
drop policy if exists "Admins can manage collections" on public.collections;
drop policy if exists "Public can read available products" on public."products for Gorosei";
drop policy if exists "Admins can manage products" on public."products for Gorosei";
drop policy if exists "Public can read active drops" on public.drops;
drop policy if exists "Admins can manage drops" on public.drops;
drop policy if exists "Public can join waitlist" on public.waitlist;
drop policy if exists "Admins can read waitlist" on public.waitlist;
drop policy if exists "Public can join newsletter" on public.newsletter;
drop policy if exists "Admins can read newsletter" on public.newsletter;

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

create policy "Public can read available products"
on public."products for Gorosei"
for select
to anon
using (sold = false);

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
