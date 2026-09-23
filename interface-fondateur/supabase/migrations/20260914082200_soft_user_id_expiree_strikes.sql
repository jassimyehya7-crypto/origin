-- P0: soft_user_id on reservations, EXPIREE status, ec_strikes table
-- Live Supabase already applied; this mirrors for local / fresh envs.

-- 1) Persist soft profile id on reservations
ALTER TABLE public.ec_reservations
  ADD COLUMN IF NOT EXISTS soft_user_id text;

CREATE INDEX IF NOT EXISTS ec_reservations_soft_user_idx
  ON public.ec_reservations (soft_user_id)
  WHERE soft_user_id IS NOT NULL;

-- 2) Extend reservation status check to include EXPIREE (0-strike closure)
DO $$
DECLARE
  conname text;
BEGIN
  SELECT c.conname INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND t.relname = 'ec_reservations'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%status%';

  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.ec_reservations DROP CONSTRAINT %I', conname);
  END IF;

  ALTER TABLE public.ec_reservations
    ADD CONSTRAINT ec_reservations_status_check
    CHECK (status IN (
      'EN_ATTENTE',
      'CONFIRMEE',
      'RECUPEREE',
      'REFUSEE',
      'ANNULEE',
      'NON_RECUPEREE',
      'EXPIREE'
    ));
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- 3) Durable strikes store (Pattern C — no SMS for MVP)
CREATE TABLE IF NOT EXISTS public.ec_strikes (
  key text PRIMARY KEY,
  strikes int NOT NULL DEFAULT 0,
  paused_until timestamptz,
  last_strike_at timestamptz,
  last_strike_day text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ec_strikes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ec_strikes' AND policyname = 'ec_strikes_all'
  ) THEN
    CREATE POLICY ec_strikes_all ON public.ec_strikes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ec_strikes TO anon, authenticated;
