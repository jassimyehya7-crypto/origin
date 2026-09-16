-- Single-use, high-entropy pickup QR tokens.
-- Only the service role can call the atomic consume function.
create extension if not exists pgcrypto;

alter table public.ec_reservations
  add column if not exists pickup_token text,
  add column if not exists pickup_token_hash text,
  add column if not exists pickup_token_created_at timestamptz,
  add column if not exists pickup_token_consumed_at timestamptz,
  add column if not exists pickup_token_expires_at timestamptz;

create unique index if not exists ec_reservations_pickup_token_hash_uidx
  on public.ec_reservations (pickup_token_hash)
  where pickup_token_hash is not null;

create or replace function public.ec_consume_pickup_token(p_token text)
returns table (
  reservation_id text,
  offer_id text,
  shop_id text,
  consumed_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
begin
  if p_token is null or length(p_token) < 40 then
    return;
  end if;

  v_hash := encode(digest(p_token, 'sha256'), 'hex');

  return query
  update public.ec_reservations r
     set status = 'RECUPEREE',
         picked_up_at = now(),
         updated_at = now(),
         pickup_token_consumed_at = now(),
         pickup_token = null
   where r.pickup_token_hash = v_hash
     and r.status = 'CONFIRMEE'
     and r.pickup_token_consumed_at is null
     and r.pickup_token_expires_at > now()
  returning r.id, r.offer_id, r.shop_id, r.pickup_token_consumed_at;
end;
$$;

revoke all on function public.ec_consume_pickup_token(text) from public, anon, authenticated;
grant execute on function public.ec_consume_pickup_token(text) to service_role;

comment on function public.ec_consume_pickup_token(text) is
  'Atomically consumes a single-use pickup QR. A second scan returns zero rows.';
