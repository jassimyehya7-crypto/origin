import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { PGlite } from "@electric-sql/pglite";

const target = process.env.AUDIT_URL || "http://127.0.0.1:5188/pro";
const users = 200;

async function loadTest() {
  await fetch(target);
  const started = performance.now();
  const results = await Promise.all(Array.from({ length: users }, async () => {
    const requestStarted = performance.now();
    try {
      const response = await fetch(target, { headers: { "x-audit-user": crypto.randomUUID() } });
      await response.arrayBuffer();
      return { ok: response.ok, status: response.status, ms: performance.now() - requestStarted };
    } catch {
      return { ok: false, status: 0, ms: performance.now() - requestStarted };
    }
  }));
  const latencies = results.map((result) => result.ms).sort((a, b) => a - b);
  const percentile = (p) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))];
  return {
    users,
    successes: results.filter((result) => result.ok).length,
    failures: results.filter((result) => !result.ok).length,
    totalMs: Math.round(performance.now() - started),
    p50Ms: Math.round(percentile(0.5)),
    p95Ms: Math.round(percentile(0.95)),
    maxMs: Math.round(latencies.at(-1) || 0),
  };
}

async function reservationRaceTest() {
  const db = new PGlite();
  await db.exec(`
    create sequence reservation_seq;
    create role authenticated;
    create role anon;
    create role service_role;
    create publication supabase_realtime;
    create table ec_shops (
      id text primary key,
      active boolean not null,
      open_until text not null
    );
    create table ec_offers (
      id text primary key,
      shop_id text not null,
      quantity_left integer not null check (quantity_left >= 0),
      status text not null,
      offer_type text not null default 'PROMO',
      availability_mode text not null default 'lots',
      duration_minutes integer,
      created_at timestamptz not null default '2026-09-23 09:00:00+02',
      ends_at timestamptz not null default '2026-09-24 09:00:00+02'
    );
    create table ec_reservations (
      id text primary key default (('00000000-0000-4000-8000-' || lpad(nextval('reservation_seq')::text, 12, '0'))::uuid)::text,
      offer_id text not null,
      shop_id text not null,
      quantity integer not null,
      status text not null check (status in ('EN_ATTENTE','CONFIRMEE','RECUPEREE','REFUSEE','ANNULEE','NON_RECUPEREE','EXPIREE')),
      pickup_code text not null,
      client_name text not null,
      client_phone text
      ,request_id uuid
    );
  `);
  const migration = (await readFile(new URL("../supabase/migrations/20260923003000_atomic_reservations.sql", import.meta.url), "utf8"))
    .split("-- Le request_id")[0]
    .replaceAll("now()", "'2026-09-23 12:00:00+02'::timestamptz");
  await db.exec(migration);

  const offerId = "11111111-1111-4111-8111-111111111111";
  const shopId = "22222222-2222-4222-8222-222222222222";
  await db.query("insert into ec_shops values ($1, true, '19:00')", [shopId]);
  await db.query("insert into ec_offers (id, shop_id, quantity_left, status) values ($1, $2, 8, 'PUBLIEE')", [offerId, shopId]);

  const attempts = await Promise.all(Array.from({ length: 15 }, (_, index) =>
    db.query(
      "select * from reserve_offer_atomic($1, 1, $2, null, $3)",
      [offerId, `Client ${index + 1}`, crypto.randomUUID()],
    ),
  ));
  const accepted = attempts.flatMap((result) => result.rows).filter((row) => row.success).length;
  const rejected = 15 - accepted;
  const stock = await db.query("select quantity_left from ec_offers where id = $1", [offerId]);
  const reservations = await db.query("select count(*)::integer as count from ec_reservations");
  const retryId = crypto.randomUUID();
  await db.query("update ec_offers set quantity_left = 1 where id = $1", [offerId]);
  const retryA = await db.query("select * from reserve_offer_atomic($1, 1, $2, null, $3)", [offerId, "Retry client", retryId]);
  const retryB = await db.query("select * from reserve_offer_atomic($1, 1, $2, null, $3)", [offerId, "Retry client", retryId]);
  const retryStock = await db.query("select quantity_left from ec_offers where id = $1", [offerId]);
  await db.query("update ec_shops set open_until = '11:00' where id = $1", [shopId]);
  await db.query("update ec_offers set quantity_left = 1 where id = $1", [offerId]);
  const closed = await db.query("select * from reserve_offer_atomic($1, 1, 'Closed client', null, $2)", [offerId, crypto.randomUUID()]);
  await db.query("update ec_shops set open_until = '19:00' where id = $1", [shopId]);
  await db.query("update ec_offers set ends_at = '2026-09-23 11:00:00+02' where id = $1", [offerId]);
  const expired = await db.query("select * from reserve_offer_atomic($1, 1, 'Expired client', null, $2)", [offerId, crypto.randomUUID()]);
  await db.close();
  return {
    simultaneousAttempts: 15,
    initialLots: 8,
    accepted,
    rejected,
    remainingLots: stock.rows[0].quantity_left,
    reservationsCreated: reservations.rows[0].count,
    oversold: accepted > 8 || stock.rows[0].quantity_left < 0,
    idempotentRetry: retryA.rows[0].reservation_id === retryB.rows[0].reservation_id && retryStock.rows[0].quantity_left === 0,
    closedRejected: closed.rows[0].success === false,
    expiredRejected: expired.rows[0].success === false,
  };
}

const [load, race] = await Promise.all([loadTest(), reservationRaceTest()]);
console.log(JSON.stringify({ load, race }, null, 2));
