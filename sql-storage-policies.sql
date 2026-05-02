-- Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add collection_id to products table
ALTER TABLE "products for Gorosei" ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES public.collections(id);

-- Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products for Gorosei" ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can read collections" ON collections FOR SELECT USING (true);
CREATE POLICY "Public can read products" ON "products for Gorosei" FOR SELECT USING (true);

-- Allow authenticated insert/update (for admin)
CREATE POLICY "Admin can manage collections" ON collections FOR ALL USING (true);
CREATE POLICY "Admin can manage products" ON "products for Gorosei" FOR ALL USING (true);