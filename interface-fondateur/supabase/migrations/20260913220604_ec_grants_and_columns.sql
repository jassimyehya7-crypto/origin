-- Grants for demo anon/authenticated access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ec_shops TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ec_offers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ec_reservations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ec_scans TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ec_presence TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ec_favorites TO anon, authenticated;

ALTER TABLE public.ec_shops
  ADD COLUMN IF NOT EXISTS zip text NOT NULL DEFAULT '1844',
  ADD COLUMN IF NOT EXISTS device_plan text NOT NULL DEFAULT 'telephone',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS emoji text NOT NULL DEFAULT '🛒',
  ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#2E7D32';

ALTER TABLE public.ec_offers
  ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT 'lot';

ALTER TABLE public.ec_reservations
  ADD COLUMN IF NOT EXISTS client_name text NOT NULL DEFAULT 'Client',
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS picked_up_at timestamptz;

ALTER TABLE public.ec_scans
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS browsed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS picked_up boolean NOT NULL DEFAULT false;

ALTER TABLE public.ec_presence
  ADD COLUMN IF NOT EXISTS page text NOT NULL DEFAULT '/';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'ec_favorites'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ec_favorites;
  END IF;
END $$;
