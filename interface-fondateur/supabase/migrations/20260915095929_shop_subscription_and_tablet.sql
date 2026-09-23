-- Magasin live modules: subscription + tablet request flow
ALTER TABLE public.ec_shops
  ADD COLUMN IF NOT EXISTS subscription_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tablet_request_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS tablet_requested_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ec_shops_tablet_request_status_check'
  ) THEN
    ALTER TABLE public.ec_shops
      ADD CONSTRAINT ec_shops_tablet_request_status_check
      CHECK (tablet_request_status = ANY (ARRAY['none'::text, 'pending'::text, 'approved'::text, 'installed'::text]));
  END IF;
END $$;

-- Align existing tablette shops with installed status
UPDATE public.ec_shops
SET tablet_request_status = 'installed'
WHERE device_plan = 'tablette'
  AND tablet_request_status = 'none';
