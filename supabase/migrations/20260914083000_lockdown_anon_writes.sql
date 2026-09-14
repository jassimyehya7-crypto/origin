-- P0 security: revoke anon/authenticated writes. Server uses SERVICE ROLE.
-- Anon keeps SELECT only on public catalogue tables (shops, offers) for browse + Realtime.
-- PII tables (reservations, strikes) and operational tables: no anon access.

-- 1) Drop open write policies
DROP POLICY IF EXISTS ec_shops_write ON public.ec_shops;
DROP POLICY IF EXISTS ec_offers_write ON public.ec_offers;
DROP POLICY IF EXISTS ec_reservations_write ON public.ec_reservations;
DROP POLICY IF EXISTS ec_scans_write ON public.ec_scans;
DROP POLICY IF EXISTS ec_presence_write ON public.ec_presence;
DROP POLICY IF EXISTS ec_favorites_write ON public.ec_favorites;
DROP POLICY IF EXISTS ec_strikes_all ON public.ec_strikes;

-- 2) Remove public SELECT on PII / sensitive tables
DROP POLICY IF EXISTS ec_reservations_read ON public.ec_reservations;
DROP POLICY IF EXISTS ec_scans_read ON public.ec_scans;
DROP POLICY IF EXISTS ec_presence_read ON public.ec_presence;
DROP POLICY IF EXISTS ec_favorites_read ON public.ec_favorites;

-- Keep public read on shops + offers (client feed / Realtime)
-- ec_shops_read / ec_offers_read already exist

-- 3) Revoke table grants — re-grant SELECT only where public
REVOKE ALL ON public.ec_shops FROM anon, authenticated;
REVOKE ALL ON public.ec_offers FROM anon, authenticated;
REVOKE ALL ON public.ec_reservations FROM anon, authenticated;
REVOKE ALL ON public.ec_scans FROM anon, authenticated;
REVOKE ALL ON public.ec_presence FROM anon, authenticated;
REVOKE ALL ON public.ec_favorites FROM anon, authenticated;
REVOKE ALL ON public.ec_strikes FROM anon, authenticated;

GRANT SELECT ON public.ec_shops TO anon, authenticated;
GRANT SELECT ON public.ec_offers TO anon, authenticated;

-- Service role bypasses RLS; no grants needed for it.
