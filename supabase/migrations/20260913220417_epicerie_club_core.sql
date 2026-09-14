-- Épicerie Club core schema (prefixed ec_ to isolate from other apps)
create extension if not exists "pgcrypto";

create table if not exists public.ec_shops (
  id text primary key,
  slug text not null unique,
  name text not null,
  category text not null,
  address text not null,
  city text not null default 'Villeneuve',
  lat double precision not null,
  lng double precision not null,
  open_until text not null default '19:00',
  phone text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ec_offers (
  id text primary key,
  shop_id text not null references public.ec_shops(id) on delete cascade,
  title text not null,
  description text,
  offer_type text not null check (offer_type in ('FLASH','PROMO','ARRIVAGE','DERNIERE_MINUTE')),
  price numeric(10,2) not null,
  original_price numeric(10,2),
  quantity_total integer not null check (quantity_total >= 0),
  quantity_left integer not null check (quantity_left >= 0),
  status text not null check (status in ('BROUILLON','PUBLIEE','EPUISEE','EXPIREE','SUSPENDUE')),
  ends_at timestamptz not null,
  published_at timestamptz,
  views integer not null default 0,
  image_emoji text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ec_offers_shop_idx on public.ec_offers(shop_id);
create index if not exists ec_offers_status_idx on public.ec_offers(status);

create table if not exists public.ec_reservations (
  id text primary key,
  offer_id text not null references public.ec_offers(id) on delete cascade,
  shop_id text not null references public.ec_shops(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  status text not null check (status in ('EN_ATTENTE','CONFIRMEE','RECUPEREE','REFUSEE','ANNULEE','NON_RECUPEREE')),
  pickup_code text not null,
  client_phone text,
  client_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ec_reservations_shop_idx on public.ec_reservations(shop_id);
create index if not exists ec_reservations_status_idx on public.ec_reservations(status);

create table if not exists public.ec_scans (
  id text primary key default gen_random_uuid()::text,
  shop_id text not null references public.ec_shops(id) on delete cascade,
  shop_slug text not null,
  browsed_no_reserve boolean not null default true,
  reserved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ec_scans_shop_idx on public.ec_scans(shop_id);

create table if not exists public.ec_presence (
  client_id text primary key,
  last_seen timestamptz not null default now()
);

create table if not exists public.ec_favorites (
  client_id text not null,
  shop_id text not null references public.ec_shops(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, shop_id)
);

-- Realtime
alter publication supabase_realtime add table public.ec_shops;
alter publication supabase_realtime add table public.ec_offers;
alter publication supabase_realtime add table public.ec_reservations;
alter publication supabase_realtime add table public.ec_scans;
alter publication supabase_realtime add table public.ec_presence;

-- RLS
alter table public.ec_shops enable row level security;
alter table public.ec_offers enable row level security;
alter table public.ec_reservations enable row level security;
alter table public.ec_scans enable row level security;
alter table public.ec_presence enable row level security;
alter table public.ec_favorites enable row level security;

create policy ec_shops_read on public.ec_shops for select using (true);
create policy ec_offers_read on public.ec_offers for select using (true);
create policy ec_reservations_read on public.ec_reservations for select using (true);
create policy ec_scans_read on public.ec_scans for select using (true);
create policy ec_presence_read on public.ec_presence for select using (true);
create policy ec_favorites_read on public.ec_favorites for select using (true);

-- Demo writes allowed for anon (pilote) — tighten later with auth
create policy ec_shops_write on public.ec_shops for all using (true) with check (true);
create policy ec_offers_write on public.ec_offers for all using (true) with check (true);
create policy ec_reservations_write on public.ec_reservations for all using (true) with check (true);
create policy ec_scans_write on public.ec_scans for all using (true) with check (true);
create policy ec_presence_write on public.ec_presence for all using (true) with check (true);
create policy ec_favorites_write on public.ec_favorites for all using (true) with check (true);
