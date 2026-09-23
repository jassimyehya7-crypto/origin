-- Un identifiant de requête unique rend la réservation idempotente. Une
-- réponse réseau perdue peut être rejouée sans diminuer le stock deux fois.
alter table public.ec_reservations
  add column if not exists request_id uuid;

create unique index if not exists ec_reservations_request_id_key
  on public.ec_reservations (request_id)
  where request_id is not null;
create index if not exists ec_reservations_offer_id_idx
  on public.ec_reservations (offer_id);
create index if not exists ec_reservations_shop_created_idx
  on public.ec_reservations (shop_id, created_at desc);

create or replace function public.ec_elapsed_open_minutes(
  p_start timestamptz, p_end timestamptz, p_close text
)
returns numeric language plpgsql stable set search_path = public
as $$
declare
  v_start timestamp := p_start at time zone 'Europe/Zurich';
  v_end timestamp := p_end at time zone 'Europe/Zurich';
  v_day date;
  v_from timestamp;
  v_to timestamp;
  v_total numeric := 0;
begin
  if p_start is null or p_end is null or p_close is null then return 0; end if;
  for v_day in select generate_series(v_start::date, v_end::date, interval '1 day')::date loop
    if extract(isodow from v_day) < 7 then
      v_from := greatest(v_start, v_day + time '08:00');
      v_to := least(v_end, v_day + p_close::time);
      if v_to > v_from then
        v_total := v_total + extract(epoch from v_to - v_from) / 60;
      end if;
    end if;
  end loop;
  return v_total;
end;
$$;

-- Empêche toute surréservation en verrouillant la ligne de l'offre pendant
-- la diminution du stock et la création de la réservation.
create or replace function public.reserve_offer_atomic(
  p_offer_id text,
  p_quantity integer,
  p_client_name text,
  p_client_phone text default null,
  p_request_id uuid default null
)
returns table (
  success boolean,
  reservation_id uuid,
  pickup_code text,
  remaining_stock integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id text;
  v_remaining integer;
  v_reservation_id uuid;
  v_pickup_code text;
  v_existing_offer text;
  v_existing_quantity integer;
begin
  if p_quantity is null or p_quantity < 1 or p_request_id is null then
    return query select false, null::uuid, null::text, null::integer;
    return;
  end if;

  -- Sérialise deux appels simultanés portant le même identifiant de requête.
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));

  select r.id::uuid, r.pickup_code, o.quantity_left, r.offer_id, r.quantity
    into v_reservation_id, v_pickup_code, v_remaining, v_existing_offer, v_existing_quantity
    from public.ec_reservations r
    join public.ec_offers o on o.id = r.offer_id
   where r.request_id = p_request_id;

  if found then
    if v_existing_offer <> p_offer_id or v_existing_quantity <> p_quantity then
      return query select false, null::uuid, null::text, null::integer;
      return;
    end if;
    return query select true, v_reservation_id, v_pickup_code, v_remaining;
    return;
  end if;

  update public.ec_offers o
     set quantity_left = o.quantity_left - p_quantity
   where o.id = p_offer_id
     and o.status = 'PUBLIEE'
     and o.quantity_left >= p_quantity
     and exists (
       select 1 from public.ec_shops s
       where s.id = o.shop_id and s.active = true
         and (now() at time zone 'Europe/Zurich')::time >= time '08:00'
         and (now() at time zone 'Europe/Zurich')::time < s.open_until::time
         and extract(isodow from now() at time zone 'Europe/Zurich') < 7
         and (
           (o.offer_type = 'FLASH' and
             (o.created_at at time zone 'Europe/Zurich')::date = (now() at time zone 'Europe/Zurich')::date)
           or (o.offer_type <> 'FLASH' and o.availability_mode = 'duration' and
             public.ec_elapsed_open_minutes(o.created_at, now(), s.open_until) < o.duration_minutes)
           or (o.offer_type <> 'FLASH' and o.availability_mode = 'lots' and now() < o.ends_at)
         )
     )
  returning shop_id, quantity_left into v_shop_id, v_remaining;

  if not found then
    return query select false, null::uuid, null::text, null::integer;
    return;
  end if;

  v_pickup_code := 'EC-' || lpad((1000 + floor(random() * 9000))::integer::text, 4, '0');
  v_reservation_id := gen_random_uuid();

  insert into public.ec_reservations (
    id, offer_id, shop_id, quantity, status, pickup_code, client_name, client_phone, request_id
  ) values (
    v_reservation_id::text, p_offer_id, v_shop_id, p_quantity, 'EN_ATTENTE', v_pickup_code, p_client_name, p_client_phone, p_request_id
  );

  return query select true, v_reservation_id, v_pickup_code, v_remaining;
end;
$$;

revoke all on function public.reserve_offer_atomic(text, integer, text, text, uuid) from public;
grant execute on function public.reserve_offer_atomic(text, integer, text, text, uuid) to authenticated, anon;

-- Le request_id est une capacité aléatoire conservée uniquement sur l'appareil
-- du client. Il permet de récupérer ou d'annuler SA réservation sans rendre
-- toute la table ec_reservations publique.
create or replace function public.client_reservation_by_request(p_request_id uuid)
returns jsonb
language sql security definer set search_path = public
as $$
  select to_jsonb(r) || jsonb_build_object('ec_offers', to_jsonb(o), 'ec_shops', to_jsonb(s))
  from public.ec_reservations r
  join public.ec_offers o on o.id = r.offer_id
  join public.ec_shops s on s.id = r.shop_id
  where r.request_id = p_request_id
  limit 1;
$$;

revoke all on function public.client_reservation_by_request(uuid) from public;
grant execute on function public.client_reservation_by_request(uuid) to authenticated, anon;

create or replace function public.cancel_client_reservation(p_request_id uuid)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_reservation public.ec_reservations%rowtype;
begin
  select * into v_reservation from public.ec_reservations
  where request_id = p_request_id for update;
  if not found or v_reservation.status not in ('EN_ATTENTE', 'CONFIRMEE') then
    return false;
  end if;
  update public.ec_offers
  set quantity_left = quantity_left + v_reservation.quantity
  where id = v_reservation.offer_id;
  update public.ec_reservations
  set status = 'ANNULEE', updated_at = now()
  where id = v_reservation.id;
  return true;
end;
$$;

revoke all on function public.cancel_client_reservation(uuid) from public;
grant execute on function public.cancel_client_reservation(uuid) to authenticated, anon;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ec_offers'
  ) then alter publication supabase_realtime add table public.ec_offers; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ec_reservations'
  ) then alter publication supabase_realtime add table public.ec_reservations; end if;
end $$;

-- Un compte commerçant doit être lié explicitement à son commerce par
-- l'administrateur. Une inscription publique ne donne aucun accès pro.
create table if not exists public.ec_shop_memberships (
  shop_id text not null references public.ec_shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (shop_id, user_id)
);
create index if not exists ec_shop_memberships_user_id_idx
  on public.ec_shop_memberships (user_id);
alter table public.ec_shop_memberships enable row level security;
revoke all on public.ec_shop_memberships from anon, authenticated;

create or replace function public.merchant_shop_for_user()
returns text language sql security definer set search_path = public
as $$
  select m.shop_id from public.ec_shop_memberships m
  where m.user_id = (select auth.uid()) limit 1;
$$;
revoke all on function public.merchant_shop_for_user() from public, anon;
grant execute on function public.merchant_shop_for_user() to authenticated;

create or replace function public.merchant_reservations()
returns jsonb language sql security definer set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(r) || jsonb_build_object('ec_offers', to_jsonb(o), 'ec_shops', to_jsonb(s)) order by r.created_at desc), '[]'::jsonb)
  from public.ec_reservations r
  join public.ec_shop_memberships m on m.shop_id = r.shop_id and m.user_id = (select auth.uid())
  join public.ec_offers o on o.id = r.offer_id
  join public.ec_shops s on s.id = r.shop_id;
$$;
revoke all on function public.merchant_reservations() from public, anon;
grant execute on function public.merchant_reservations() to authenticated;

-- Réserve la transition des commandes au commerçant propriétaire du commerce.
create or replace function public.transition_reservation_atomic(
  p_reservation_id uuid,
  p_new_status text,
  p_pickup_code text default null
)
returns boolean language plpgsql security definer set search_path = public
as $$
declare
  v_reservation public.ec_reservations%rowtype;
  v_target_status text;
begin
  if (select auth.uid()) is null then return false; end if;
  select * into v_reservation from public.ec_reservations
  where id = p_reservation_id::text for update;
  if not found then return false; end if;
  if not exists (
    select 1 from public.ec_shop_memberships
    where shop_id = v_reservation.shop_id and user_id = (select auth.uid())
  ) then return false; end if;
  v_target_status := case p_new_status
    when 'confirmed' then 'CONFIRMEE'
    when 'refused' then 'REFUSEE'
    when 'picked' then 'RECUPEREE'
    else null
  end;
  if v_target_status is null then return false; end if;
  if v_reservation.status in ('REFUSEE', 'ANNULEE', 'RECUPEREE', 'NON_RECUPEREE', 'EXPIREE') then return false; end if;
  if p_new_status = 'confirmed' and v_reservation.status <> 'EN_ATTENTE' then return false; end if;
  if p_new_status = 'refused' and v_reservation.status <> 'EN_ATTENTE' then return false; end if;
  if p_new_status = 'picked' and (
    v_reservation.status <> 'CONFIRMEE' or
    upper(coalesce(p_pickup_code, '')) <> upper(v_reservation.pickup_code)
  ) then return false; end if;
  if p_new_status = 'refused' then
    update public.ec_offers set quantity_left = quantity_left + v_reservation.quantity
    where id = v_reservation.offer_id;
  end if;
  update public.ec_reservations set status = v_target_status, updated_at = now()
  where id = p_reservation_id::text;
  return true;
end;
$$;
revoke all on function public.transition_reservation_atomic(uuid, text, text) from public, anon;
grant execute on function public.transition_reservation_atomic(uuid, text, text) to authenticated;

alter table public.ec_offers
  add column if not exists availability_mode text not null default 'lots',
  add column if not exists duration_minutes integer;

create or replace function public.merchant_create_offer(p_payload jsonb)
returns text language plpgsql security definer set search_path = public
as $$
declare
  v_shop_id text := p_payload->>'shop_id';
  v_type text := p_payload->>'offer_type';
  v_mode text := p_payload->>'availability_mode';
  v_title text := trim(p_payload->>'title');
  v_price numeric := (p_payload->>'price')::numeric;
  v_stock integer := (p_payload->>'stock')::integer;
  v_duration integer := nullif(p_payload->>'duration_minutes', '')::integer;
  v_id text := 'pro-' || gen_random_uuid()::text;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.ec_shop_memberships
    where shop_id = v_shop_id and user_id = (select auth.uid())
  ) then raise exception 'Accès commerçant refusé'; end if;
  if v_title = '' or length(v_title) > 140 or v_price <= 0 or v_stock < 1 then
    raise exception 'Offre invalide'; end if;
  if v_type not in ('FLASH', 'PROMO', 'ARRIVAGE', 'DERNIERE_MINUTE') or
     v_mode not in ('lots', 'duration') or
     (v_type = 'DERNIERE_MINUTE' and v_mode <> 'duration') or
     (v_mode = 'duration' and (v_duration is null or v_duration < 30 or v_duration > 1440)) then
    raise exception 'Type ou durée invalide'; end if;
  perform pg_advisory_xact_lock(hashtextextended('offer-quota:' || v_shop_id || ':' || v_type || ':' || date_trunc('month', now())::text, 0));
  if v_type in ('ARRIVAGE', 'DERNIERE_MINUTE') and (
    select count(*) from public.ec_offers
    where shop_id = v_shop_id and offer_type = v_type
      and created_at >= date_trunc('month', now())
      and created_at < date_trunc('month', now()) + interval '1 month'
  ) >= 2 then raise exception 'Limite mensuelle atteinte'; end if;

  insert into public.ec_offers (
    id, shop_id, title, offer_type, price, original_price,
    quantity_total, quantity_left, status, ends_at, published_at,
    unit, image_url, availability_mode, duration_minutes
  ) values (
    v_id, v_shop_id, v_title, v_type, v_price,
    nullif(p_payload->>'original_price', '')::numeric,
    v_stock, v_stock, 'PUBLIEE', now() + make_interval(mins => coalesce(v_duration, 1440)), now(),
    coalesce(nullif(p_payload->>'unit', ''), 'lot'), p_payload->>'image_url', v_mode, v_duration
  );
  return v_id;
end;
$$;
revoke all on function public.merchant_create_offer(jsonb) from public, anon;
grant execute on function public.merchant_create_offer(jsonb) to authenticated;

create or replace function public.merchant_hide_offer(p_offer_id text)
returns boolean language plpgsql security definer set search_path = public
as $$
begin
  update public.ec_offers o set status = 'SUSPENDUE', updated_at = now()
  where o.id = p_offer_id and o.status = 'PUBLIEE' and exists (
    select 1 from public.ec_shop_memberships m
    where m.shop_id = o.shop_id and m.user_id = (select auth.uid())
  );
  return found;
end;
$$;
revoke all on function public.merchant_hide_offer(text) from public, anon;
grant execute on function public.merchant_hide_offer(text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('offer-photos', 'offer-photos', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create or replace function public.can_manage_shop(p_shop_id text)
returns boolean language sql security definer set search_path = public
as $$
  select exists (
    select 1 from public.ec_shop_memberships m
    where m.shop_id = p_shop_id and m.user_id = (select auth.uid())
  );
$$;
revoke all on function public.can_manage_shop(text) from public, anon;
grant execute on function public.can_manage_shop(text) to authenticated;

drop policy if exists "merchant_upload_offer_photo" on storage.objects;
create policy "merchant_upload_offer_photo" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'offer-photos' and public.can_manage_shop(split_part(name, '/', 1))
);
