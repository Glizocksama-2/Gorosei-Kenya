-- Adds multi-photo gallery support while keeping the existing cover image column.

alter table public."products for Gorosei"
  add column if not exists "Image_urls" text[] not null default array[]::text[];

update public."products for Gorosei"
set "Image_urls" = array["Image_url"]
where coalesce(array_length("Image_urls", 1), 0) = 0
  and "Image_url" is not null;
