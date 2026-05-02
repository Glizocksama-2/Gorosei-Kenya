-- Optional starter data. Safe to skip.

insert into public.collections (name, active)
values ('Launch Drop', true)
on conflict do nothing;

insert into public.drops (collection_name, drop_date, active, locked)
values (
  'Launch Drop',
  now() + interval '7 days',
  true,
  true
)
on conflict do nothing;
