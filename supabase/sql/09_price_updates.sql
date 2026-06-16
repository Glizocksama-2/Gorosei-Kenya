-- Standardize current Gorosei product prices.

alter table public."products for Gorosei"
  alter column "Price" set default 650;

update public."products for Gorosei"
set "Price" = case
  when lower("Name") like '%hockey%' and lower("Name") like '%jersey%' then 1250
  when category = 'jackets' and lower("Name") ~ '(^|[^[:alnum:]])(heavy|varsity)([^[:alnum:]]|$)' then 2000
  when category = 'jackets' and lower("Name") ~ '(^|[^[:alnum:]])light(weight)?([^[:alnum:]]|$)' then 1500
  when category = 'jackets' then 2000
  when category = 'tshirts' then 650
  else "Price"
end
where
  lower("Name") like '%hockey%' and lower("Name") like '%jersey%'
  or category in ('tshirts', 'jackets');
