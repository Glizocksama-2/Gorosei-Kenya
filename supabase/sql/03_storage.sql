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

drop policy if exists "Public can read product images" on storage.objects;
drop policy if exists "Authenticated users can upload product images" on storage.objects;
drop policy if exists "Authenticated users can update product images" on storage.objects;
drop policy if exists "Authenticated users can delete product images" on storage.objects;

create policy "Public can read product images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'products-images');

create policy "Authenticated users can upload product images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'products-images');

create policy "Authenticated users can update product images"
on storage.objects
for update
to authenticated
using (bucket_id = 'products-images')
with check (bucket_id = 'products-images');

create policy "Authenticated users can delete product images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'products-images');
