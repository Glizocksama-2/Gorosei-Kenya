-- Allows the storefront to show sold products as an archive while admin controls still use auth.

drop policy if exists "Public can read available products" on public."products for Gorosei";
drop policy if exists "Public can read storefront products" on public."products for Gorosei";

create policy "Public can read storefront products"
on public."products for Gorosei"
for select
to anon
using (true);
