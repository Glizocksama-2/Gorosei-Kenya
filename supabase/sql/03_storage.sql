-- Storage bucket and policies for product images.
-- The app uploads into the "products-images" bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products-images',
  'products-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Allow public reads" on storage.objects;
drop policy if exists "Public can read product images" on storage.objects;
drop policy if exists "Authenticated users can upload product images" on storage.objects;
drop policy if exists "Authenticated users can update product images" on storage.objects;
drop policy if exists "Authenticated users can delete product images" on storage.objects;
drop policy if exists "Admins can upload product images" on storage.objects;
drop policy if exists "Admins can update product images" on storage.objects;
drop policy if exists "Admins can delete product images" on storage.objects;

create policy "Admins can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'products-images'
  and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
);

create policy "Admins can update product images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'products-images'
  and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
)
with check (
  bucket_id = 'products-images'
  and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
);

create policy "Admins can delete product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'products-images'
  and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
);
