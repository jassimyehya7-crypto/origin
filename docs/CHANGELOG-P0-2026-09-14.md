# P0 audit fixes — 2026-09-14

## Done
1. **soft_user_id** — mappers round-trip; migration `20260914082200_*` (live DB already had column).
2. **Reservations API** — GET requires `softUserId` | `clientPhone` (client) or `shopId` + staff session (Pro). No unfiltered dump.
3. **Client cancel** — Annuler on `/confirmation/[id]` + `/reservations` → PATCH `ANNULEE` (restores stock).
4. **Strikes** — `ec_strikes` wired; prefers Supabase when env set, else `data/ec_strikes.json`.
5. **Staff auth (fail-closed)** — `/pro/login`, `/fondateur/login`, middleware + httpOnly cookie; mutating pro/founder/demo APIs gated. **Denied if PIN env unset.**
6. **Pitch hygiene** — ResetDemo + Pro/Fondateur links removed from client `/profil`.
7. **EXPIREE** — status check in migration (live already applied).
8. **Service role writes** — server uses `SUPABASE_SERVICE_ROLE_KEY` (never `NEXT_PUBLIC_*`).
9. **Anon lockdown migration** — `20260914083000_lockdown_anon_writes.sql` revokes anon writes + PII SELECT on reservations/strikes/etc. Anon SELECT only on `ec_shops` / `ec_offers`.

## Pins + keys (`.env.local`)
```
EC_PRO_PIN=…
EC_FOUNDER_PIN=…
SUPABASE_SERVICE_ROLE_KEY=…   # Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
```
See `.env.local.example`. Do not commit secrets.

## Live Supabase — apply remaining?
- soft_user_id / EXPIREE / ec_strikes: **already on live** (parent confirmed).
- **`20260914083000_lockdown_anon_writes.sql` must still be applied** on live for anon write lockdown (or equivalent SQL in dashboard). Until then, anon key can still write if old policies remain.

## Honest security gaps (not 9.9 yet)
- PIN cookie ≠ real Auth (Supabase Auth / SSO / per-merchant users).
- Client cancel authenticated only by knowing reservation id (IDOR residual) — mitigate later with softUserId check on PATCH.
- No rate limiting / CSRF beyond SameSite cookies.
- Realtime on reservations muted for anon after lockdown (by design).
- Service role is powerful — keep it server-only; rotate if leaked.
