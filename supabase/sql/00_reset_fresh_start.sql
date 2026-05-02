-- DANGER: Fresh-start reset for Gorosei Kenya.
-- Run this only when you intentionally want to delete store data and rebuild.
-- Recommended order:
-- 1. 00_reset_fresh_start.sql
-- 2. 01_schema.sql
-- 3. 02_rls_policies.sql
-- 4. 03_storage.sql
-- 5. 04_seed_optional.sql

drop table if exists public.waitlist cascade;
drop table if exists public.newsletter cascade;
drop table if exists public."products for Gorosei" cascade;
drop table if exists public.drops cascade;
drop table if exists public.collections cascade;

delete from storage.objects where bucket_id = 'products-images';
delete from storage.buckets where id = 'products-images';
