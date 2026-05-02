-- Quick checks after setup.

select 'collections' as table_name, count(*) from public.collections
union all
select 'products for Gorosei', count(*) from public."products for Gorosei"
union all
select 'drops', count(*) from public.drops
union all
select 'waitlist', count(*) from public.waitlist
union all
select 'newsletter', count(*) from public.newsletter;

select id, name, public
from storage.buckets
where id = 'products-images';
