-- Create newsletter table
CREATE TABLE IF NOT EXISTS newsletter (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow public inserts
ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;

-- Create policy for inserts
DROP POLICY IF EXISTS "Allow public inserts" ON newsletter;
CREATE POLICY "Allow public inserts" ON newsletter FOR INSERT WITH CHECK (true);

-- Allow selects
DROP POLICY IF EXISTS "Allow public selects" ON newsletter;
CREATE POLICY "Allow public selects" ON newsletter FOR SELECT USING (true);