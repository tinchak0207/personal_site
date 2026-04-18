-- Supabase Schema for Neural Blog
-- Execute this in the Supabase SQL Editor

-- 1. Create the posts table
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  published BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow public read access to published posts
CREATE POLICY "Public can read published posts"
  ON public.posts
  FOR SELECT
  USING (published = true);

-- [SECURITY WARNING]: The following policies use auth.role() = 'authenticated'
-- which means ANY logged-in user can modify posts. In a real production app,
-- you MUST restrict this to specific admin emails or an admin role.
-- Example of a secure policy:
-- USING (auth.jwt() ->> 'email' = 'your-admin@email.com');

-- Allow authenticated users (admin) to read all posts (including drafts)
CREATE POLICY "Admins can read all posts"
  ON public.posts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert posts
CREATE POLICY "Admins can insert posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update posts
CREATE POLICY "Admins can update posts"
  ON public.posts
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete posts
CREATE POLICY "Admins can delete posts"
  ON public.posts
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- 4. Create an automatic updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();