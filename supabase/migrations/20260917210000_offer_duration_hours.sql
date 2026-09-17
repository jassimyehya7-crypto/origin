ALTER TABLE public.ec_offers
  ADD COLUMN IF NOT EXISTS duration_hours smallint
    CHECK (duration_hours IN (3, 6, 12));

-- Timed offers have no stock cap; zero is the existing valid sentinel.
ALTER TABLE public.ec_offers
  ADD CONSTRAINT ec_offers_timed_quantity_check
    CHECK (duration_hours IS NULL OR (quantity_total = 0 AND quantity_left = 0));
