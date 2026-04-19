ALTER TABLE public.graph_subnodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to graph_subnodes"
  ON public.graph_subnodes FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage graph_subnodes"
  ON public.graph_subnodes FOR ALL
  USING (auth.role() = 'authenticated');

NOTIFY pgrst, 'reload schema';
