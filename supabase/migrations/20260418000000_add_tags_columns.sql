-- Migration: Add missing 'tags' columns
-- This migration adds the tags columns to posts, projects, and external_links tables if they are missing.

ALTER TABLE IF EXISTS public.posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE IF EXISTS public.projects ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE IF EXISTS public.external_links ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];

-- Force PostgREST to reload the schema cache so the new columns are recognized
NOTIFY pgrst, 'reload schema';
