-- Run this in your Supabase SQL Editor

-- 1. Disable RLS on the correct table
ALTER TABLE "products for Gorosei" DISABLE ROW LEVEL SECURITY;

-- 2. Also check if storage bucket policies are needed
-- Create storage policies for the bucket if needed
DROP POLICY IF EXISTS "products for Gorosei anon insert" ON storage.objects;
DROP POLICY IF EXISTS "products for Gorosei anon select" ON storage.objects;

CREATE POLICY "products for Gorosei anon insert" ON storage.objects
FOR INSERT TO anon, authenticated 
WITH CHECK (bucket_id = 'products for Gorosei');

CREATE POLICY "products for Gorosei anon select" ON storage.objects
FOR SELECT TO anon, authenticated 
USING (bucket_id = 'products for Gorosei');

-- 3. Force cache refresh by querying the table
SELECT * FROM "products for Gorosei" LIMIT 0;