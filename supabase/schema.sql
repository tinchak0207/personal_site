-- Supabase Schema for Neural Blog
-- Execute this in the Supabase SQL Editor

-- 1. Create the posts table
CREATE TABLE IF NOT EXISTS public.posts (
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

-- 5. Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT,
  github_url TEXT,
  image_url TEXT,
  published BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published projects" ON public.projects FOR SELECT USING (published = true);
CREATE POLICY "Admins can read all projects" ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert projects" ON public.projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update projects" ON public.projects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete projects" ON public.projects FOR DELETE USING (auth.role() = 'authenticated');

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- 7. Create graph_nodes table
CREATE TABLE IF NOT EXISTS public.graph_nodes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  group_type TEXT DEFAULT 'node' NOT NULL,
  radius INTEGER DEFAULT 5 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.graph_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read graph_nodes" ON public.graph_nodes FOR SELECT USING (true);
CREATE POLICY "Admins can manage graph_nodes" ON public.graph_nodes USING (auth.role() = 'authenticated');

-- 8. Create graph_links table
CREATE TABLE IF NOT EXISTS public.graph_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  target TEXT REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(source, target)
);

ALTER TABLE public.graph_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read graph_links" ON public.graph_links FOR SELECT USING (true);
CREATE POLICY "Admins can manage graph_links" ON public.graph_links USING (auth.role() = 'authenticated');
CREATE TABLE IF NOT EXISTS public.external_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  published BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.external_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published external_links" ON public.external_links FOR SELECT USING (published = true);
CREATE POLICY "Admins can read all external_links" ON public.external_links FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert external_links" ON public.external_links FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update external_links" ON public.external_links FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete external_links" ON public.external_links FOR DELETE USING (auth.role() = 'authenticated');

CREATE TRIGGER update_external_links_updated_at
  BEFORE UPDATE ON public.external_links
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ==============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES (Idempotent)
-- Run this if you get "Could not find the 'tags' column... in the schema cache"
-- ==============================================================================
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.external_links ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];

-- Force Supabase's PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
