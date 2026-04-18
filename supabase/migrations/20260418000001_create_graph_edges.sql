-- Migration: Create graph_edges table for dynamic connections
-- This migration creates the graph_edges table to manage connections between nodes.

CREATE TABLE IF NOT EXISTS public.graph_edges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  target TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(source, target)
);

-- RLS Policies
ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to graph_edges"
  ON public.graph_edges FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage graph_edges"
  ON public.graph_edges FOR ALL
  USING (auth.role() = 'authenticated');

-- Force PostgREST to reload the schema cache so the new table is recognized
NOTIFY pgrst, 'reload schema';
