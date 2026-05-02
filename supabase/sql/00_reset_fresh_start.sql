-- DANGER: Fresh-start reset for Gorosei Kenya.
-- Run this only when you intentionally want to delete store data and rebuild.
-- Recommended order:
-- 1. 00_reset_fresh_start.sql
-- 2. 01_schema.sql
-- 3. 02_rls_policies.sql
-- 4. 03_storage.sql
-- 5. 04_seed_optional.sql
-- 6. 05_admin_user.sql
-- 7. 99_diagnostics.sql

drop table if exists public.waitlist cascade;
drop table if exists public.newsletter cascade;
drop table if exists public."products for Gorosei" cascade;
drop table if exists public."products_for_Gorosei" cascade;
drop table if exists public.drops cascade;
drop table if exists public.collections cascade;
drop table if exists public.admin_users cascade;

-- Supabase does not allow direct SQL deletion from storage.objects.
-- To clear old product images, use the Supabase Dashboard:
-- Storage -> products-images -> select files/folders -> Delete.
--
-- The bucket itself is recreated/updated safely in 03_storage.sql.
