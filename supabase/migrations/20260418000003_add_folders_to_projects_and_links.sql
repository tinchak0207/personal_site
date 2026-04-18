-- Add folder column to projects and external_links tables for hierarchical organization
ALTER TABLE IF EXISTS public.projects ADD COLUMN IF NOT EXISTS folder TEXT DEFAULT '/';
ALTER TABLE IF EXISTS public.external_links ADD COLUMN IF NOT EXISTS folder TEXT DEFAULT '/';

-- Force PostgREST to reload the schema cache so the new columns are recognized
NOTIFY pgrst, 'reload schema';
