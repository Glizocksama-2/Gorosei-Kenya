-- Row-level security for the storefront.
-- Public users can read available storefront data and submit forms.
-- Authenticated users can manage admin data through the admin UI.

alter table public.collections enable row level security;
alter table public."products for Gorosei" enable row level security;
alter table public.drops enable row level security;
alter table public.waitlist enable row level security;
alter table public.newsletter enable row level security;

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

create policy "Public can read active collections"
on public.collections
for select
to anon, authenticated
using (active = true);

create policy "Admins can manage collections"
on public.collections
for all
to authenticated
using (true)
with check (true);

create policy "Public can read available products"
on public."products for Gorosei"
for select
to anon, authenticated
using (sold = false);

create policy "Admins can manage products"
on public."products for Gorosei"
for all
to authenticated
using (true)
with check (true);

create policy "Public can read active drops"
on public.drops
for select
to anon, authenticated
using (active = true);

create policy "Admins can manage drops"
on public.drops
for all
to authenticated
using (true)
with check (true);

create policy "Public can join waitlist"
on public.waitlist
for insert
to anon, authenticated
with check (true);

create policy "Admins can read waitlist"
on public.waitlist
for select
to authenticated
using (true);

create policy "Public can join newsletter"
on public.newsletter
for insert
to anon, authenticated
with check (true);

create policy "Admins can read newsletter"
on public.newsletter
for select
to authenticated
using (true);
