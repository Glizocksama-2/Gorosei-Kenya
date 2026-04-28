-- Run this in Supabase SQL Editor to enable uploads

-- 1. Allow anyone to upload to the bucket
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT TO anon, authenticated 
WITH CHECK (bucket_id = 'products for Gorosei');

-- 2. Allow anyone to view uploaded files
CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT TO anon, authenticated 
USING (bucket_id = 'products for Gorosei');

-- 3. Allow updates if needed
CREATE POLICY "Allow public updates" ON storage.objects
FOR UPDATE TO anon, authenticated 
USING (bucket_id = 'products for Gorosei');

-- 4. Allow deletes if needed
CREATE POLICY "Allow public deletes" ON storage.objects
FOR DELETE TO anon, authenticated 
USING (bucket_id = 'products for Gorosei');