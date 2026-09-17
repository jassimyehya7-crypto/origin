# Backend Supabase — OffresLocal

Tables `ec_*`: shops, offers, reservations, scans, presence, favorites, strikes + Realtime.

## Keys
- **Anon** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`): client browse + Realtime on shops/offers only.
- **Service role** (`SUPABASE_SERVICE_ROLE_KEY`): server-only writes via Next.js API. Never expose to browser.

## Migrations
Apply in order under `migrations/`. Live may already have soft_user_id / EXPIREE / ec_strikes.
**Apply `20260914083000_lockdown_anon_writes.sql` on live** to revoke anon writes.

Seed: `npm run seed:supabase` (needs service role after lockdown).
