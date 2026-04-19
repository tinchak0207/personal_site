ALTER TABLE public.timeline_events
ADD COLUMN folder TEXT DEFAULT '/',
ADD COLUMN tags TEXT[] DEFAULT '{}'::TEXT[];

NOTIFY pgrst, 'reload schema';
