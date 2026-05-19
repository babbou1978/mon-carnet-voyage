-- parse_unclear_logs
-- Captures every parse-intent call where Claude flagged terms it couldn't
-- interpret. The weekly digest job aggregates these to suggest prompt
-- improvements.
--
-- HOW TO RUN:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"

CREATE TABLE IF NOT EXISTS public.parse_unclear_logs (
  id            bigserial PRIMARY KEY,
  text          text        NOT NULL,
  unclear_terms text[]      NOT NULL,
  parsed_output jsonb,
  lang          text,
  ts            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS parse_unclear_logs_ts_idx
  ON public.parse_unclear_logs (ts DESC);

-- RLS on, no policies for anon / authenticated → only service_role (used by
-- the backend) can read or write. The Data API exposes nothing publicly.
ALTER TABLE public.parse_unclear_logs ENABLE ROW LEVEL SECURITY;
