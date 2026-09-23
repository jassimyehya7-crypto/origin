alter table public.ec_shop_memberships
  add column if not exists must_change_password boolean not null default true;

create table if not exists public.ec_founder_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  must_set_password boolean not null default true
);
alter table public.ec_founder_memberships
  add column if not exists must_set_password boolean not null default true;
alter table public.ec_founder_memberships enable row level security;
revoke all on public.ec_founder_memberships from anon, authenticated;

create or replace function public.merchant_access_for_user()
returns jsonb language sql security definer set search_path=public
as $$
  select jsonb_build_object('shop_id', m.shop_id, 'must_change_password', m.must_change_password)
  from public.ec_shop_memberships m
  where m.user_id=(select auth.uid())
  limit 1;
$$;
revoke all on function public.merchant_access_for_user() from public, anon;
grant execute on function public.merchant_access_for_user() to authenticated;

create or replace function public.founder_access_for_user()
returns boolean language sql security definer set search_path=public
as $$
  select exists (
    select 1 from public.ec_founder_memberships f
    where f.user_id=(select auth.uid())
  );
$$;
revoke all on function public.founder_access_for_user() from public, anon;
grant execute on function public.founder_access_for_user() to authenticated;

create or replace function public.founder_setup_required()
returns boolean language sql security definer set search_path=public
as $$
  select coalesce((select f.must_set_password from public.ec_founder_memberships f where f.user_id=(select auth.uid())),true);
$$;
revoke all on function public.founder_setup_required() from public, anon;
grant execute on function public.founder_setup_required() to authenticated;
