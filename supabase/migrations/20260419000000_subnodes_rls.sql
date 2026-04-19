-- Migration: Enable RLS and add policies for graph_subnodes
-- This migration fixes the "new row violates row-level security policy" error

ALTER TABLE public.graph_subnodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to graph_subnodes"
  ON public.graph_subnodes FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage graph_subnodes"
  ON public.graph_subnodes FOR ALL
  USING (auth.role() = 'authenticated');

-- Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
