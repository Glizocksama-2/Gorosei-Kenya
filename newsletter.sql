-- Create newsletter table
CREATE TABLE IF NOT EXISTS newsletter (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public inserts" ON newsletter;
DROP POLICY IF EXISTS "Allow public selects" ON newsletter;
DROP POLICY IF EXISTS "Public can join newsletter" ON newsletter;
DROP POLICY IF EXISTS "Admins can read newsletter" ON newsletter;

GRANT INSERT ON newsletter TO anon, authenticated;
GRANT SELECT ON newsletter TO authenticated;

CREATE POLICY "Public can join newsletter"
ON newsletter
FOR INSERT
TO anon, authenticated
WITH CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$');

CREATE POLICY "Admins can read newsletter"
ON newsletter
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
