-- ==============================================================================
-- TIMELINE EVENTS INITIALIZATION SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR TO SET UP THE TIMELINE FEATURE COMPLETELY
-- ==============================================================================

-- 1. Create timeline_events table (if not exists)
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  image_url TEXT,
  link TEXT,
  folder TEXT DEFAULT '/',
  tags TEXT[] DEFAULT '{}'::TEXT[],
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure folder and tags columns exist in case the table was created previously without them
ALTER TABLE public.timeline_events ADD COLUMN IF NOT EXISTS folder TEXT DEFAULT '/';
ALTER TABLE public.timeline_events ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];

-- 2. Create handle_updated_at function (standard utility function, ignores if exists)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Add trigger for updated_at
DROP TRIGGER IF EXISTS handle_timeline_events_updated_at ON public.timeline_events;
CREATE TRIGGER handle_timeline_events_updated_at
  BEFORE UPDATE ON public.timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to prevent conflicts during recreation
DROP POLICY IF EXISTS "Public can read published timeline_events" ON public.timeline_events;
DROP POLICY IF EXISTS "Admins can manage timeline_events" ON public.timeline_events;

-- 6. Create clean RLS Policies
-- Policy 1: Anyone (anon/public) can read rows where published = true
CREATE POLICY "Public can read published timeline_events"
  ON public.timeline_events FOR SELECT
  USING (published = true);

-- Policy 2: Authenticated users (admin) can do EVERYTHING (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage timeline_events"
  ON public.timeline_events FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 7. Force PostgREST to reload schema cache so changes take effect immediately on API
NOTIFY pgrst, 'reload schema';
