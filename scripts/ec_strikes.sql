-- Optional: Pattern C strikes + SMS outbox stubs (no Twilio required)
create table if not exists ec_strikes (
  key text primary key,
  strikes int not null default 0,
  paused_until timestamptz,
  last_strike_at timestamptz,
  last_strike_day text,
  updated_at timestamptz default now()
);

create table if not exists ec_sms_outbox (
  id text primary key,
  "to" text not null,
  body text not null,
  level int not null,
  reservation_id text,
  status text not null default 'stubbed',
  created_at timestamptz default now()
);

-- If ec_reservations.status is an enum/check, allow EXPIREE (0-strike closure):
-- alter type ... add value 'EXPIREE';  -- or drop check and re-add including EXPIREE
