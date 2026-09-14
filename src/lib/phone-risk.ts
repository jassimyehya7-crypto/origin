/**
 * Pattern C / no-show strikes — Zero SMS for MVP.
 * Persists to data/ec_strikes.json.
 * Keys: normalized phone and/or soft user id.
 * SMS channel deferred (Twilio later); in-app messages only.
 */
import fs from "fs";
import path from "path";

import { normalizePhoneKey, hasClientPhone } from "./phone";
import { riskMessage } from "./risk-status";

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

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "ec_strikes.json");

declare global {
  // eslint-disable-next-line no-var
  var __ecStrikesStore: StoreFile | undefined;
}

function emptyStore(): StoreFile {
  return { strikes: [], softByResa: {}, outbox: [] };
}

function load(): StoreFile {
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

function persist(store: StoreFile) {
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

function getOrCreate(store: StoreFile, key: string): StrikeRecord {
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

export function linkReservationSoftId(
  reservationId: string,
  softUserId?: string | null
): void {
  const id = (softUserId || "").trim();
  if (!reservationId || !id) return;
  const store = load();
  store.softByResa[reservationId] = id;
  persist(store);
}

export function softIdForReservation(reservationId: string): string | undefined {
  return load().softByResa[reservationId];
}

export function recordNoShow(opts: {
  phone?: string | null;
  softUserId?: string | null;
  reservationId?: string;
}): StrikeStatus {
  const store = load();
  let soft = (opts.softUserId || "").trim();
  if (!soft && opts.reservationId) {
    soft = store.softByResa[opts.reservationId] || "";
  }
  const keys = strikeKeys({ phone: opts.phone, softUserId: soft });
  if (keys.length === 0) {
    // Still allow anonymous soft-less no-show tracking by reservation
    if (opts.reservationId) {
      keys.push(`resa:${opts.reservationId}`);
    } else {
      return { risk: false, noShows: 0, strikes: 0, paused: false };
    }
  }

  const today = civilDay();
  let maxStrikes = 0;
  let pausedUntil: string | undefined;

  for (const key of keys) {
    const row = getOrCreate(store, key);
    // Max 1 strike / civil day
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

  // SMS deferred for MVP — do not enqueue outbox / pretend-send.
  // Strikes + ban remain recorded above; clients see in-app copy via riskMessage.

  persist(store);

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
export function recordNoShowPhone(phone: string | undefined | null): void {
  recordNoShow({ phone });
}

export function decrementStrike(opts: {
  phone?: string | null;
  softUserId?: string | null;
  reservationId?: string;
}): void {
  const store = load();
  let soft = (opts.softUserId || "").trim();
  if (!soft && opts.reservationId) {
    soft = store.softByResa[opts.reservationId] || "";
  }
  const keys = strikeKeys({ phone: opts.phone, softUserId: soft });
  for (const key of keys) {
    const row = store.strikes.find((r) => r.key === key);
    if (!row) continue;
    row.strikes = Math.max(0, (row.strikes || 0) - 1);
    if (row.strikes < 3) row.pausedUntil = undefined;
    row.lastStrikeDay = undefined;
  }
  persist(store);
}

export function getStrikeStatus(opts: {
  phone?: string | null;
  softUserId?: string | null;
}): StrikeStatus {
  const store = load();
  const keys = strikeKeys(opts);
  if (keys.length === 0) {
    return { risk: false, noShows: 0, strikes: 0, paused: false };
  }
  let strikes = 0;
  let pausedUntil: string | undefined;
  for (const key of keys) {
    const row = store.strikes.find((r) => r.key === key);
    if (!row) continue;
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
  // Auto-lift pause
  if (pausedUntil && new Date(pausedUntil).getTime() <= Date.now()) {
    for (const key of keys) {
      const row = store.strikes.find((r) => r.key === key);
      if (row?.pausedUntil === pausedUntil) {
        row.pausedUntil = undefined;
        // After ban: counter back to 1 (under watch), not 0
        if (row.strikes >= 3) row.strikes = 1;
      }
    }
    persist(store);
    pausedUntil = undefined;
    strikes = Math.min(strikes, 1);
  }
  const paused = Boolean(
    pausedUntil && new Date(pausedUntil).getTime() > Date.now()
  );
  return {
    risk: strikes >= 1,
    noShows: strikes,
    strikes,
    paused,
    pausedUntil,
    note:
      strikes >= 1
        ? inAppNote(strikes, paused ? pausedUntil : undefined)
        : undefined,
  };
}

export function getPhoneRisk(phone: string | undefined | null): {
  risk: boolean;
  noShows: number;
} {
  const s = getStrikeStatus({ phone });
  return { risk: s.risk, noShows: s.noShows };
}

export function isPaused(opts: {
  phone?: string | null;
  softUserId?: string | null;
}): { paused: boolean; until?: string; message?: string } {
  const s = getStrikeStatus(opts);
  if (!s.paused || !s.pausedUntil) return { paused: false };
  return {
    paused: true,
    until: s.pausedUntil,
    message: riskMessage(Math.max(s.strikes, 3), s.pausedUntil) || undefined,
  };
}

/** @deprecated SMS deferred — returns legacy outbox rows if any remain on disk. */
export function getSmsOutbox(): SmsOutboxRow[] {
  return [...load().outbox];
}

export function resetStrikesDemo(): void {
  persist(emptyStore());
}
