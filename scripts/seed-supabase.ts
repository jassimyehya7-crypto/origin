/**
 * Upsert seed data from src/lib/seed.ts into ec_* tables.
 * Usage: npx tsx --env-file=.env.local scripts/seed-supabase.ts
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnvLocal();

import { createClient } from "@supabase/supabase-js";
import { createInitialState } from "../src/lib/seed";
import {
  offerToRow,
  reservationToRow,
  scanToRow,
  shopToRow,
} from "../src/lib/supabase/mappers";
import { DEMO_CLIENT_ID } from "../src/lib/supabase/env";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY");
    process.exit(1);
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const state = createInitialState();

  console.log("Clearing ec_* …");
  await sb.from("ec_reservations").delete().neq("id", "");
  await sb.from("ec_favorites").delete().neq("client_id", "");
  await sb.from("ec_scans").delete().neq("id", "");
  await sb.from("ec_presence").delete().neq("client_id", "");
  await sb.from("ec_offers").delete().neq("id", "");
  await sb.from("ec_shops").delete().neq("id", "");

  console.log(`Upserting ${state.shops.length} shops…`);
  {
    const { error } = await sb.from("ec_shops").upsert(state.shops.map(shopToRow));
    if (error) throw error;
  }

  console.log(`Upserting ${state.offers.length} offers…`);
  {
    const { error } = await sb.from("ec_offers").upsert(
      state.offers.map((o) => ({ ...offerToRow(o), created_at: o.createdAt }))
    );
    if (error) throw error;
  }

  console.log(`Upserting ${state.reservations.length} reservations…`);
  {
    const { error } = await sb
      .from("ec_reservations")
      .upsert(state.reservations.map(reservationToRow));
    if (error) throw error;
  }

  console.log(`Upserting ${state.scans.length} scans…`);
  {
    const { error } = await sb.from("ec_scans").upsert(state.scans.map(scanToRow));
    if (error) throw error;
  }

  console.log(`Upserting ${state.favorites.length} favorites…`);
  {
    const { error } = await sb.from("ec_favorites").upsert(
      state.favorites.map((f) => ({
        client_id: DEMO_CLIENT_ID,
        shop_id: f.shopId,
        created_at: f.addedAt,
      }))
    );
    if (error) throw error;
  }

  console.log(`Upserting ${state.presence.length} presence…`);
  {
    const { error } = await sb.from("ec_presence").upsert(
      state.presence.map((p) => ({
        client_id: p.sessionId,
        last_seen: p.lastSeen,
        page: p.page,
      }))
    );
    if (error) throw error;
  }

  const counts = await Promise.all(
    [
      "ec_shops",
      "ec_offers",
      "ec_reservations",
      "ec_scans",
      "ec_favorites",
      "ec_presence",
    ].map(async (table) => {
      const { count, error } = await sb
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return [table, count ?? 0] as const;
    })
  );

  console.log("\nSeed complete:");
  for (const [table, count] of counts) {
    console.log(`  ${table}: ${count}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
