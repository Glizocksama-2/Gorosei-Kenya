-- Allow the current store owner account to use the admin dashboard.
-- Change this email if your Supabase Auth admin account changes.

insert into public.admin_users (user_id)
select id
from auth.users
where email = 'glizocksama@gmail.com'
on conflict (user_id) do nothing;
