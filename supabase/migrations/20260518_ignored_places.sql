-- ignored_places
-- A user can hide a Google place from future search results without rating
-- it. Different from a low-rated favourite: this stays PRIVATE, does NOT
-- influence the AI taste profile, and is never shared with friends.
--
-- HOW TO RUN:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"

CREATE TABLE IF NOT EXISTS public.ignored_places (
  id              bigserial PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_place_id text        NOT NULL,
  name            text,
  ts              timestamptz DEFAULT now(),
  UNIQUE (user_id, google_place_id)
);

CREATE INDEX IF NOT EXISTS ignored_places_user_idx
  ON public.ignored_places (user_id);

ALTER TABLE public.ignored_places ENABLE ROW LEVEL SECURITY;

-- Per-user RLS: a user can only see / add / remove their own ignored entries.
CREATE POLICY "Users read their own ignored places"
  ON public.ignored_places FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert their own ignored places"
  ON public.ignored_places FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete their own ignored places"
  ON public.ignored_places FOR DELETE TO authenticated
  USING (user_id = auth.uid());
