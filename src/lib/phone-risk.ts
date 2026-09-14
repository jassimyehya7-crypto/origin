/**
 * Pattern C / no-show strikes — Zero SMS for MVP.
 * Prefers Supabase `ec_strikes` when configured; falls back to data/ec_strikes.json.
 * Keys: normalized phone and/or soft user id.
 * SMS channel deferred (Twilio later); in-app messages only.
 */
import fs from "fs";
import path from "path";

import { normalizePhoneKey, hasClientPhone } from "./phone";
import { riskMessage } from "./risk-status";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";

export { normalizePhoneKey, hasClientPhone };

export type StrikeRecord = {
  key: string;
  strikes: number;
  pausedUntil?: string;
  lastStrikeAt?: string;
  lastStrikeDay?: string;
};

/** @deprecated SMS deferred for MVP — kept for file shape compatibility only. */
export type SmsOutboxRow = {
  id: string;
  to: string;
  body: string;
  level: 1 | 2 | 3;
  reservationId?: string;
  status: "queued" | "sent" | "cancelled" | "stubbed";
  createdAt: string;
};

export type StrikeStatus = {
  risk: boolean;
  noShows: number;
  strikes: number;
  paused: boolean;
  pausedUntil?: string;
  note?: string;
};

type StoreFile = {
  strikes: StrikeRecord[];
  softByResa: Record<string, string>;
  /** Legacy; no longer written on strike (SMS deferred). */
  outbox: SmsOutboxRow[];
};

type EcStrikeRow = {
  key: string;
  strikes: number;
  paused_until: string | null;
  last_strike_at: string | null;
  last_strike_day: string | null;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "ec_strikes.json");

declare global {
  // eslint-disable-next-line no-var
  var __ecStrikesStore: StoreFile | undefined;
}

function emptyStore(): StoreFile {
  return { strikes: [], softByResa: {}, outbox: [] };
}

function loadLocal(): StoreFile {
  if (global.__ecStrikesStore) return global.__ecStrikesStore;
  try {
    if (fs.existsSync(FILE)) {
      const parsed = JSON.parse(fs.readFileSync(FILE, "utf8")) as StoreFile;
      global.__ecStrikesStore = {
        strikes: parsed.strikes || [],
        softByResa: parsed.softByResa || {},
        outbox: parsed.outbox || [],
      };
      return global.__ecStrikesStore;
    }
  } catch {
    /* ignore */
  }
  global.__ecStrikesStore = emptyStore();
  return global.__ecStrikesStore;
}

function persistLocal(store: StoreFile) {
  global.__ecStrikesStore = store;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = path.join(DATA_DIR, "ec_strikes.json.tmp");
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
    fs.renameSync(tmp, FILE);
  } catch (err) {
    console.error("[strikes] persist failed", err);
  }
}

function softKey(softUserId: string | undefined | null): string {
  const s = (softUserId || "").trim();
  return s ? `soft:${s}` : "";
}

/** Prefer phone key; fall back to soft id. */
export function strikeKeys(opts: {
  phone?: string | null;
  softUserId?: string | null;
}): string[] {
  const keys: string[] = [];
  const p = normalizePhoneKey(opts.phone);
  const s = softKey(opts.softUserId);
  if (p) keys.push(p);
  if (s) keys.push(s);
  return keys;
}

function getOrCreateLocal(store: StoreFile, key: string): StrikeRecord {
  let row = store.strikes.find((r) => r.key === key);
  if (!row) {
    row = { key, strikes: 0 };
    store.strikes.push(row);
  }
  return row;
}

function civilDay(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function inAppNote(strikes: number, pausedUntil?: string): string | undefined {
  return riskMessage(strikes, pausedUntil) || undefined;
}

function rowToRecord(r: EcStrikeRow): StrikeRecord {
  return {
    key: r.key,
    strikes: r.strikes || 0,
    pausedUntil: r.paused_until || undefined,
    lastStrikeAt: r.last_strike_at || undefined,
    lastStrikeDay: r.last_strike_day || undefined,
  };
}

function recordToUpsert(row: StrikeRecord) {
  return {
    key: row.key,
    strikes: row.strikes,
    paused_until: row.pausedUntil ?? null,
    last_strike_at: row.lastStrikeAt ?? null,
    last_strike_day: row.lastStrikeDay ?? null,
    updated_at: new Date().toISOString(),
  };
}

async function fetchRemoteRows(keys: string[]): Promise<StrikeRecord[]> {
  const sb = createServerClient();
  if (!sb || keys.length === 0) return [];
  const { data, error } = await sb
    .from("ec_strikes")
    .select("*")
    .in("key", keys);
  if (error) {
    console.error("[strikes] supabase read failed", error.message);
    return [];
  }
  return ((data as EcStrikeRow[]) || []).map(rowToRecord);
}

async function upsertRemote(rows: StrikeRecord[]): Promise<boolean> {
  const sb = createServerClient();
  if (!sb || rows.length === 0) return false;
  const { error } = await sb.from("ec_strikes").upsert(rows.map(recordToUpsert));
  if (error) {
    console.error("[strikes] supabase upsert failed", error.message);
    return false;
  }
  return true;
}

function prefersRemote(): boolean {
  return isSupabaseConfigured();
}

export function linkReservationSoftId(
  reservationId: string,
  softUserId?: string | null
): void {
  const id = (softUserId || "").trim();
  if (!reservationId || !id) return;
  const store = loadLocal();
  store.softByResa[reservationId] = id;
  persistLocal(store);
}

export function softIdForReservation(reservationId: string): string | undefined {
  return loadLocal().softByResa[reservationId];
}

function statusFromRows(rows: StrikeRecord[]): StrikeStatus {
  let strikes = 0;
  let pausedUntil: string | undefined;
  for (const row of rows) {
    strikes = Math.max(strikes, row.strikes || 0);
    if (row.pausedUntil) {
      if (
        !pausedUntil ||
        new Date(row.pausedUntil).getTime() > new Date(pausedUntil).getTime()
      ) {
        pausedUntil = row.pausedUntil;
      }
    }
  }
  const paused = Boolean(
    pausedUntil && new Date(pausedUntil).getTime() > Date.now()
  );
  return {
    risk: strikes >= 1,
    noShows: strikes,
    strikes,
    paused,
    pausedUntil: paused ? pausedUntil : undefined,
    note:
      strikes >= 1
        ? inAppNote(strikes, paused ? pausedUntil : undefined)
        : undefined,
  };
}

export async function recordNoShow(opts: {
  phone?: string | null;
  softUserId?: string | null;
  reservationId?: string;
}): Promise<StrikeStatus> {
  let soft = (opts.softUserId || "").trim();
  if (!soft && opts.reservationId) {
    soft = softIdForReservation(opts.reservationId) || "";
  }
  const keys = strikeKeys({ phone: opts.phone, softUserId: soft });
  if (keys.length === 0) {
    if (opts.reservationId) {
      keys.push(`resa:${opts.reservationId}`);
    } else {
      return { risk: false, noShows: 0, strikes: 0, paused: false };
    }
  }

  const today = civilDay();
  let rows: StrikeRecord[] = [];

  if (prefersRemote()) {
    rows = await fetchRemoteRows(keys);
  }

  // Merge with local so offline keys aren't lost
  const local = loadLocal();
  for (const key of keys) {
    if (!rows.find((r) => r.key === key)) {
      const loc = local.strikes.find((r) => r.key === key);
      rows.push(loc ? { ...loc } : { key, strikes: 0 });
    }
  }

  let maxStrikes = 0;
  let pausedUntil: string | undefined;

  for (const row of rows) {
    if (row.lastStrikeDay === today) {
      maxStrikes = Math.max(maxStrikes, row.strikes);
      if (row.pausedUntil) pausedUntil = row.pausedUntil;
      continue;
    }
    row.strikes = Math.min(3, (row.strikes || 0) + 1);
    row.lastStrikeAt = new Date().toISOString();
    row.lastStrikeDay = today;
    if (row.strikes >= 3) {
      const until = new Date();
      until.setDate(until.getDate() + 7);
      row.pausedUntil = until.toISOString();
      pausedUntil = row.pausedUntil;
    }
    maxStrikes = Math.max(maxStrikes, row.strikes);
  }

  // Always mirror to local file
  for (const row of rows) {
    const loc = getOrCreateLocal(local, row.key);
    Object.assign(loc, row);
  }
  persistLocal(local);

  if (prefersRemote()) {
    await upsertRemote(rows);
  }

  return {
    risk: maxStrikes >= 1,
    noShows: maxStrikes,
    strikes: maxStrikes,
    paused: Boolean(pausedUntil && new Date(pausedUntil).getTime() > Date.now()),
    pausedUntil,
    note: inAppNote(maxStrikes, pausedUntil),
  };
}

/** Legacy helper — phone-only. */
export async function recordNoShowPhone(
  phone: string | undefined | null
): Promise<void> {
  await recordNoShow({ phone });
}

export async function decrementStrike(opts: {
  phone?: string | null;
  softUserId?: string | null;
  reservationId?: string;
}): Promise<void> {
  let soft = (opts.softUserId || "").trim();
  if (!soft && opts.reservationId) {
    soft = softIdForReservation(opts.reservationId) || "";
  }
  const keys = strikeKeys({ phone: opts.phone, softUserId: soft });
  if (keys.length === 0) return;

  const local = loadLocal();
  const rows: StrikeRecord[] = prefersRemote() ? await fetchRemoteRows(keys) : [];
  for (const key of keys) {
    if (!rows.find((r) => r.key === key)) {
      const loc = local.strikes.find((r) => r.key === key);
      if (loc) rows.push({ ...loc });
    }
  }

  const touched: StrikeRecord[] = [];
  for (const row of rows) {
    row.strikes = Math.max(0, (row.strikes || 0) - 1);
    if (row.strikes < 3) row.pausedUntil = undefined;
    row.lastStrikeDay = undefined;
    touched.push(row);
    const loc = getOrCreateLocal(local, row.key);
    Object.assign(loc, row);
  }
  persistLocal(local);
  if (prefersRemote() && touched.length) await upsertRemote(touched);
}

export async function getStrikeStatus(opts: {
  phone?: string | null;
  softUserId?: string | null;
}): Promise<StrikeStatus> {
  const keys = strikeKeys(opts);
  if (keys.length === 0) {
    return { risk: false, noShows: 0, strikes: 0, paused: false };
  }

  let rows: StrikeRecord[] = [];
  if (prefersRemote()) {
    rows = await fetchRemoteRows(keys);
  }
  const local = loadLocal();
  for (const key of keys) {
    if (!rows.find((r) => r.key === key)) {
      const loc = local.strikes.find((r) => r.key === key);
      if (loc) rows.push({ ...loc });
    }
  }

  // Auto-lift pause
  let pausedUntil: string | undefined;
  for (const row of rows) {
    if (row.pausedUntil) {
      if (
        !pausedUntil ||
        new Date(row.pausedUntil).getTime() > new Date(pausedUntil).getTime()
      ) {
        pausedUntil = row.pausedUntil;
      }
    }
  }

  if (pausedUntil && new Date(pausedUntil).getTime() <= Date.now()) {
    const touched: StrikeRecord[] = [];
    for (const row of rows) {
      if (row.pausedUntil === pausedUntil) {
        row.pausedUntil = undefined;
        if (row.strikes >= 3) row.strikes = 1;
        touched.push(row);
        const loc = getOrCreateLocal(local, row.key);
        Object.assign(loc, row);
      }
    }
    persistLocal(local);
    if (prefersRemote() && touched.length) await upsertRemote(touched);
    pausedUntil = undefined;
  }

  return statusFromRows(rows);
}

export async function getPhoneRisk(phone: string | undefined | null): Promise<{
  risk: boolean;
  noShows: number;
}> {
  const s = await getStrikeStatus({ phone });
  return { risk: s.risk, noShows: s.noShows };
}

export async function isPaused(opts: {
  phone?: string | null;
  softUserId?: string | null;
}): Promise<{ paused: boolean; until?: string; message?: string }> {
  const s = await getStrikeStatus(opts);
  if (!s.paused || !s.pausedUntil) return { paused: false };
  return {
    paused: true,
    until: s.pausedUntil,
    message: riskMessage(Math.max(s.strikes, 3), s.pausedUntil) || undefined,
  };
}

/** @deprecated SMS deferred — returns legacy outbox rows if any remain on disk. */
export function getSmsOutbox(): SmsOutboxRow[] {
  return [...loadLocal().outbox];
}

export async function resetStrikesDemo(): Promise<void> {
  persistLocal(emptyStore());
  if (prefersRemote()) {
    const sb = createServerClient();
    if (sb) {
      const { error } = await sb.from("ec_strikes").delete().neq("key", "");
      if (error) console.error("[strikes] reset remote failed", error.message);
    }
  }
}
