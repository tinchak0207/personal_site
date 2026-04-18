-- Add folder column to posts table for hierarchical organization
ALTER TABLE IF EXISTS public.posts ADD COLUMN IF NOT EXISTS folder TEXT DEFAULT '/';

-- Ensure the 'images' storage bucket exists for markdown uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Allow public read access to images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'images');

-- Allow authenticated users to insert images
CREATE POLICY "Auth Insert" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own images
CREATE POLICY "Auth Update" 
ON storage.objects FOR UPDATE 
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their own images
CREATE POLICY "Auth Delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Force PostgREST to reload the schema cache so the new column is recognized
NOTIFY pgrst, 'reload schema';
