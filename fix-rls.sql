-- Run this in Supabase SQL Editor to fix the issue
-- Go to: https://supabase.com/dashboard/project/bmasldizsbbgvrrdsfek/sql-editor

-- Option 1: Disable RLS completely (recommended for testing)
ALTER TABLE "products for Gorosei" DISABLE ROW LEVEL SECURITY;

-- Option 2: Or create a policy to allow all inserts/selects
-- DROP POLICY IF EXISTS "Allow all" ON "products for Gorosei";
-- CREATE POLICY "Allow all" ON "products for Gorosei" FOR ALL USING (true) WITH CHECK (true);