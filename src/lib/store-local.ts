import fs from "fs";
import path from "path";
import { createA1InitialState as createInitialState } from "./a1-seed";
import { emitStore } from "./store-events";
import type {
  AppState,
  Offer,
  OfferType,
  Reservation,
  ReservationStatus,
  Shop,
} from "./types";
import {
  generateCode,
  generateId,
  offerValidUntilISO,
  percent,
  shouldExpireConfirmed,
  shouldExpirePending,
  shouldExpirePublishedOffer,
} from "./utils";
import {
  decrementStrike,
  linkReservationSoftId,
  recordNoShow,
  isPaused,
  resetStrikesDemo,
} from "./phone-risk";
import { resolveClientName } from "./soft-profile";

/**
 * LocalStoreAdapter — in-process fallback when Supabase env is missing.
 * Not the production backend. Mutations go through this module so the bus
 * fires; swap the implementation to Supabase (see README « Backend & live »).
 */
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const o = value as AppState;
  return (
    Array.isArray(o.shops) &&
    Array.isArray(o.offers) &&
    Array.isArray(o.reservations)
  );
}

function loadFromDisk(): AppState | null {
  try {
    if (!fs.existsSync(STORE_FILE)) return null;
    const parsed = JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
    return isAppState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persist(state: AppState) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = path.join(DATA_DIR, "store.json.tmp");
    fs.writeFileSync(tmp, JSON.stringify(state), "utf8");
    fs.renameSync(tmp, STORE_FILE);
  } catch (err) {
    console.error("[store] local persist failed", err);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __epicerieClubStore: AppState | undefined;
}

function getState(): AppState {
  if (!global.__epicerieClubStore) {
    const loaded = loadFromDisk();
    const state = loaded ?? createInitialState();
    global.__epicerieClubStore = state;
    if (!loaded) persist(state);
  }
  return global.__epicerieClubStore;
}

function setState(next: AppState, opts?: { persist?: boolean }) {
  global.__epicerieClubStore = next;
  if (opts?.persist !== false) persist(next);
}

export async function resetDemo(): Promise<AppState> {
  const state = createInitialState();
  setState(state);
  global.__epicerieClubFounderMessages = [];
  await resetStrikesDemo();
  emitStore("offers");
  emitStore("reservations");
  emitStore("shops");
  emitStore("presence");
  emitStore("scans");
  return state;
}

export function getStore(): AppState {
  return getState();
}

export function getShops(): Shop[] {
  return getState().shops;
}

export function getShop(id: string): Shop | undefined {
  return getState().shops.find((s) => s.id === id);
}

export function getShopBySlug(slug: string): Shop | undefined {
  return getState().shops.find((s) => s.slug === slug);
}

export function updateShop(
  id: string,
  patch: Partial<Shop>
): Shop | undefined {
  const state = getState();
  const idx = state.shops.findIndex((s) => s.id === id);
  if (idx < 0) return undefined;
  state.shops[idx] = { ...state.shops[idx], ...patch };
  setState({ ...state });
  emitStore("shops");
  return state.shops[idx];
}

export function getOffers(opts?: {
  shopId?: string;
  status?: string;
  publishedOnly?: boolean;
}): Offer[] {
  let offers = getState().offers;
  if (opts?.shopId) offers = offers.filter((o) => o.shopId === opts.shopId);
  if (opts?.status) offers = offers.filter((o) => o.status === opts.status);
  if (opts?.publishedOnly) {
    const now = Date.now();
    offers = offers.filter(
      (o) =>
        o.status === "PUBLIEE" &&
        (o.durationHours || o.quantityLeft > 0) &&
        new Date(o.validUntil).getTime() >= now
    );
  }
  return [...offers].sort(
    (a, b) =>
      new Date(b.publishedAt || b.createdAt).getTime() -
      new Date(a.publishedAt || a.createdAt).getTime()
  );
}

export function getOffer(id: string): Offer | undefined {
  return getState().offers.find((o) => o.id === id);
}

export function createOffer(input: {
  shopId: string;
  title: string;
  description: string;
  type: OfferType;
  price: number;
  originalPrice?: number;
  quantityTotal: number;
  durationHours?: 3 | 6 | 12;
  unit: string;
  emoji?: string;
  imageUrl?: string;
  publish?: boolean;
}): Offer {
  const state = getState();
  const shop = state.shops.find((s) => s.id === input.shopId);
  const now = new Date().toISOString();
  const offer: Offer = {
    id: generateId("offer"),
    shopId: input.shopId,
    title: input.title,
    description: input.description,
    type: input.type,
    status: input.publish ? "PUBLIEE" : "BROUILLON",
    price: input.price,
    originalPrice: input.originalPrice,
    quantityTotal: input.quantityTotal,
    quantityLeft: input.quantityTotal,
    durationHours: input.durationHours,
    unit: input.unit || "lot",
    emoji: input.emoji || "",
    imageUrl: input.imageUrl,
    validUntil: input.durationHours
      ? new Date(Date.now() + input.durationHours * 3_600_000).toISOString()
      : offerValidUntilISO(shop?.openUntil || "19:00"),
    createdAt: now,
    publishedAt: input.publish ? now : undefined,
    views: 0,
  };
  state.offers.unshift(offer);
  if (input.publish) {
    state.alerts.unshift({
      id: generateId("alert"),
      type: "success",
      title: "Nouvelle offre publiée",
      message: `${shop?.name || "Commerce"} a publié « ${offer.title} ».`,
      createdAt: now,
      shopId: offer.shopId,
    });
  }
  setState({ ...state });
  emitStore("offers");
  return offer;
}

export function updateOffer(
  id: string,
  patch: Partial<Offer>
): Offer | undefined {
  const state = getState();
  const idx = state.offers.findIndex((o) => o.id === id);
  if (idx < 0) return undefined;
  state.offers[idx] = { ...state.offers[idx], ...patch };
  setState({ ...state });
  return state.offers[idx];
}

/** Soft-delete: mark EXPIREE (staff). Active holds restored via reservation expire if needed. */
export function deleteOffer(id: string): Offer | undefined {
  const offer = getOffer(id);
  if (!offer) return undefined;
  if (offer.status === "EXPIREE") return offer;
  const updated = updateOffer(id, { status: "EXPIREE" });
  if (updated) emitStore("offers");
  return updated;
}

export function publishOffer(id: string): Offer | undefined {
  const offer = getOffer(id);
  if (!offer) return undefined;
  const state = getState();
  const shop = state.shops.find((s) => s.id === offer.shopId);
  const now = new Date().toISOString();
  const updated = updateOffer(id, {
    status: "PUBLIEE",
    publishedAt: now,
    validUntil: offer.durationHours
      ? new Date(Date.now() + offer.durationHours * 3_600_000).toISOString()
      : offerValidUntilISO(shop?.openUntil || "19:00"),
  });
  if (updated) {
    const state = getState();
    const shop = state.shops.find((s) => s.id === updated.shopId);
    state.alerts.unshift({
      id: generateId("alert"),
      type: "success",
      title: "Nouvelle offre publiée",
      message: `${shop?.name || "Commerce"} a publié « ${updated.title} ».`,
      createdAt: now,
      shopId: updated.shopId,
    });
    setState({ ...state });
    emitStore("offers");
  }
  return getOffer(id);
}

export function incrementOfferViews(id: string) {
  const offer = getOffer(id);
  if (!offer) return;
  updateOffer(id, { views: offer.views + 1 });
}

export function getReservations(opts?: {
  shopId?: string;
  offerId?: string;
  clientPhone?: string;
  softUserId?: string;
  status?: string;
}): Reservation[] {
  let list = getState().reservations;
  if (opts?.shopId) list = list.filter((r) => r.shopId === opts.shopId);
  if (opts?.offerId) list = list.filter((r) => r.offerId === opts.offerId);
  if (opts?.clientPhone)
    list = list.filter((r) => r.clientPhone === opts.clientPhone);
  if (opts?.softUserId)
    list = list.filter((r) => r.softUserId === opts.softUserId);
  if (opts?.status) list = list.filter((r) => r.status === opts.status);
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getReservation(id: string): Reservation | undefined {
  return getState().reservations.find((r) => r.id === id);
}

function restoreStock(offerId: string, qty: number) {
  const offer = getOffer(offerId);
  if (!offer || offer.durationHours) return;
  const quantityLeft = offer.quantityLeft + qty;
  updateOffer(offerId, {
    quantityLeft,
    status:
      offer.status === "EPUISEE" && quantityLeft > 0
        ? "PUBLIEE"
        : offer.status,
  });
}

function decrementStock(offerId: string, qty: number): boolean {
  const state = getState();
  const idx = state.offers.findIndex((o) => o.id === offerId);
  if (idx < 0) return false;
  const offer = state.offers[idx];
  if (offer.status !== "PUBLIEE" || new Date(offer.validUntil).getTime() <= Date.now()) return false;
  if (offer.durationHours) return true;
  if (offer.quantityLeft < qty) return false;
  const quantityLeft = offer.quantityLeft - qty;
  state.offers[idx] = {
    ...offer,
    quantityLeft,
    status: quantityLeft === 0 ? "EPUISEE" : offer.status,
  };
  setState({ ...state });
  return true;
}

export async function createReservation(input: {
  offerId: string;
  quantity: number;
  clientName?: string;
  clientPhone?: string;
  softUserId?: string;
  message?: string;
  scanSessionId?: string;
}): Promise<{ ok: true; reservation: Reservation } | { ok: false; error: string }> {
  const state = getState();
  const offer = state.offers.find((o) => o.id === input.offerId);
  if (!offer) return { ok: false, error: "Offre introuvable" };
  if (offer.status !== "PUBLIEE")
    return { ok: false, error: "Cette offre n'est plus disponible" };
  if (new Date(offer.validUntil).getTime() <= Date.now())
    return { ok: false, error: "Cette offre est terminée" };
  // Client rule: always 1 lot / 1 réservation
  const quantity = 1;
  if (!offer.durationHours && offer.quantityLeft < quantity)
    return { ok: false, error: "Stock insuffisant" };

  const clientPhone =
    typeof input.clientPhone === "string" ? input.clientPhone.trim() : "";
  const softUserId =
    typeof input.softUserId === "string" ? input.softUserId.trim() : "";
  const pause = await isPaused({ phone: clientPhone, softUserId });
  if (pause.paused) {
    return { ok: false, error: pause.message || "Réservation en pause" };
  }

  const ok = decrementStock(offer.id, quantity);
  if (!ok) return { ok: false, error: "Stock insuffisant" };

  const now = new Date().toISOString();
  const reservation: Reservation = {
    id: generateId("resa"),
    offerId: offer.id,
    shopId: offer.shopId,
    clientName: resolveClientName(input.clientName),
    clientPhone,
    softUserId: softUserId || undefined,
    quantity,
    status: "EN_ATTENTE",
    code: generateCode(),
    message: input.message,
    createdAt: now,
    updatedAt: now,
  };
  if (softUserId) linkReservationSoftId(reservation.id, softUserId);

  const fresh = getState();
  fresh.reservations.unshift(reservation);

  if (input.scanSessionId) {
    const scan = fresh.scans.find((s) => s.sessionId === input.scanSessionId);
    if (scan) {
      scan.reserved = true;
      scan.browsed = true;
    }
  }

  setState({ ...fresh });
  emitStore("reservations");
  emitStore("offers");
  return { ok: true, reservation };
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<{ ok: true; reservation: Reservation } | { ok: false; error: string }> {
  const state = getState();
  const idx = state.reservations.findIndex((r) => r.id === id);
  if (idx < 0) return { ok: false, error: "Réservation introuvable" };

  const current = state.reservations[idx];
  const now = new Date().toISOString();

  // Stock restore on refuse / cancel / no-show / expire (unknown)
  const restoreStatuses: ReservationStatus[] = [
    "REFUSEE",
    "ANNULEE",
    "NON_RECUPEREE",
    "EXPIREE",
  ];
  const heldStatuses: ReservationStatus[] = ["EN_ATTENTE", "CONFIRMEE"];

  if (
    heldStatuses.includes(current.status) &&
    restoreStatuses.includes(status)
  ) {
    restoreStock(current.offerId, current.quantity);
  }

  // Undo « Pas venu » → CONFIRMEE: re-hold stock
  if (current.status === "NON_RECUPEREE" && status === "CONFIRMEE") {
    decrementStock(current.offerId, current.quantity);
  }

  const updated: Reservation = {
    ...current,
    status,
    updatedAt: now,
    confirmedAt:
      status === "CONFIRMEE" ? now : current.confirmedAt,
    pickedUpAt: status === "RECUPEREE" ? now : current.pickedUpAt,
  };

  state.reservations[idx] = updated;

  if (status === "RECUPEREE") {
    const scan = state.scans.find(
      (s) => s.shopId === updated.shopId && s.reserved && !s.pickedUp
    );
    if (scan) scan.pickedUp = true;
    // Pro correction: NON_RECUPEREE → RECUPEREE removes strike
    if (current.status === "NON_RECUPEREE") {
      await decrementStrike({
        phone: updated.clientPhone,
        softUserId: updated.softUserId,
        reservationId: updated.id,
      });
    }
  }

  // Undo « Pas venu » → CONFIRMEE removes strike
  if (current.status === "NON_RECUPEREE" && status === "CONFIRMEE") {
    await decrementStrike({
      phone: updated.clientPhone,
      softUserId: updated.softUserId,
      reservationId: updated.id,
    });
  }

  // NON_RECUPEREE only via Pro « Pas venue » — never auto
  if (status === "NON_RECUPEREE" && current.status !== "NON_RECUPEREE") {
    await recordNoShow({
      phone: updated.clientPhone,
      softUserId: updated.softUserId,
      reservationId: updated.id,
    });
  }

  setState({ ...state });
  emitStore("reservations");
  emitStore("offers");
  return { ok: true, reservation: updated };
}

export async function cancelExpiredConfirmed(): Promise<number> {
  // Default without Pro gesture = EXPIREE (0 strike, restore stock). NEVER auto-NON_RECUPEREE.
  // Only openUntil crossing + same-day confirm rule — never offer.validUntil alone.
  const state = getState();
  const now = new Date();
  let count = 0;
  for (const resa of state.reservations) {
    if (resa.status !== "CONFIRMEE") continue;
    const shop = state.shops.find((s) => s.id === resa.shopId);
    if (!shop) continue;
    if (shouldExpireConfirmed(resa, shop.openUntil, now)) {
      await updateReservationStatus(resa.id, "EXPIREE");
      count++;
    }
  }
  return count;
}

/** Force-expire remaining CONFIRMEE → EXPIREE (no strike). Used by ensure + legacy API. */
export async function expireConfirmedRemaining(shopId?: string): Promise<number> {
  const state = getState();
  let count = 0;
  const ids = state.reservations
    .filter((r) => {
      if (r.status !== "CONFIRMEE") return false;
      if (shopId && r.shopId !== shopId) return false;
      return true;
    })
    .map((r) => r.id);
  for (const id of ids) {
    const r = getReservation(id);
    if (r?.status === "CONFIRMEE") {
      await updateReservationStatus(id, "EXPIREE");
      count++;
    }
  }
  return count;
}

/**
 * Idempotent end-of-day for a shop (Europe/Zurich openUntil).
 * CONFIRMEE → EXPIREE only if pastClose AND confirmed during the day that ended.
 * EN_ATTENTE → EXPIREE after pastClose (same-day rule), 0 strike.
 * PUBLIEE → EXPIREE if validUntil past OR pastClose same-day (not brand-new after close).
 * Never expire CONFIRMEE solely because offer.validUntil is past.
 */
export async function ensureShopDayClosed(
  shopId: string
): Promise<{ expiredReservations: number; expiredOffers: number }> {
  const state = getState();
  const shop = state.shops.find((s) => s.id === shopId);
  if (!shop) return { expiredReservations: 0, expiredOffers: 0 };

  const now = new Date();
  let expiredOffers = 0;
  let expiredReservations = 0;

  for (const offer of state.offers.filter((o) => o.shopId === shopId)) {
    if (offer.status !== "PUBLIEE") continue;
    if (shouldExpirePublishedOffer(offer, shop.openUntil, now)) {
      updateOffer(offer.id, { status: "EXPIREE" });
      expiredOffers++;
    }
  }

  const ids = state.reservations
    .filter(
      (r) =>
        r.shopId === shopId &&
        (r.status === "CONFIRMEE" || r.status === "EN_ATTENTE")
    )
    .map((r) => r.id);
  for (const id of ids) {
    const resa = getReservation(id);
    if (!resa) continue;
    if (resa.status === "CONFIRMEE") {
      if (shouldExpireConfirmed(resa, shop.openUntil, now)) {
        await updateReservationStatus(id, "EXPIREE");
        expiredReservations++;
      }
    } else if (resa.status === "EN_ATTENTE") {
      if (shouldExpirePending(resa, shop.openUntil, now)) {
        await updateReservationStatus(id, "EXPIREE");
        expiredReservations++;
      }
    }
  }

  return { expiredReservations, expiredOffers };
}

export function getFavorites() {
  return getState().favorites;
}

export function toggleFavorite(shopId: string): boolean {
  const state = getState();
  const idx = state.favorites.findIndex((f) => f.shopId === shopId);
  if (idx >= 0) {
    state.favorites.splice(idx, 1);
    setState({ ...state });
    return false;
  }
  state.favorites.push({ shopId, addedAt: new Date().toISOString() });
  setState({ ...state });
  return true;
}

export function recordScan(shopSlug: string, sessionId?: string) {
  const state = getState();
  const shop = state.shops.find((s) => s.slug === shopSlug);
  if (!shop) return null;
  const sid = sessionId || generateId("sess");
  const existing = state.scans.find(
    (s) => s.sessionId === sid && s.shopSlug === shopSlug
  );
  if (existing) return existing;
  const scan = {
    id: generateId("scan"),
    shopId: shop.id,
    shopSlug,
    scannedAt: new Date().toISOString(),
    sessionId: sid,
    browsed: false,
    reserved: false,
    pickedUp: false,
  };
  state.scans.unshift(scan);
  setState({ ...state });
  emitStore("scans");
  return scan;
}

export function markScanBrowsed(sessionId: string, shopSlug: string) {
  const state = getState();
  const scan = state.scans.find(
    (s) => s.sessionId === sessionId && s.shopSlug === shopSlug
  );
  if (scan) {
    scan.browsed = true;
    setState({ ...state });
    emitStore("scans");
  }
}

export function heartbeat(sessionId: string, page: string) {
  const state = getState();
  const now = new Date().toISOString();
  const idx = state.presence.findIndex((p) => p.sessionId === sessionId);
  if (idx >= 0) {
    state.presence[idx] = { sessionId, lastSeen: now, page };
  } else {
    state.presence.push({ sessionId, lastSeen: now, page });
  }
  // prune stale (> 2 min)
  const cutoff = Date.now() - 2 * 60_000;
  state.presence = state.presence.filter(
    (p) => new Date(p.lastSeen).getTime() > cutoff
  );
  setState({ ...state }, { persist: false });
  emitStore("presence");
  return state.presence.length;
}

export function getLiveClients(): number {
  const state = getState();
  const cutoff = Date.now() - 2 * 60_000;
  return state.presence.filter(
    (p) => new Date(p.lastSeen).getTime() > cutoff
  ).length;
}

export function getFounderStats() {
  const state = getState();
  const shops = state.shops;

  const perShop = shops.map((shop) => {
    const offers = state.offers.filter((o) => o.shopId === shop.id);
    const published = offers.filter((o) => o.status === "PUBLIEE").length;
    const weekOffers = offers.filter((o) => {
      const d = new Date(o.createdAt).getTime();
      return Date.now() - d < 7 * 24 * 3600_000;
    }).length;
    const reservas = state.reservations.filter((r) => r.shopId === shop.id);
    const confirmed = reservas.filter((r) =>
      ["CONFIRMEE", "RECUPEREE"].includes(r.status)
    ).length;
    const picked = reservas.filter((r) => r.status === "RECUPEREE").length;
    const scans = state.scans.filter((s) => s.shopId === shop.id);
    const browsedNoReserve = scans.filter(
      (s) => s.browsed && !s.reserved
    ).length;
    const scanReserved = scans.filter((s) => s.reserved).length;
    const scanPicked = scans.filter((s) => s.pickedUp).length;

    return {
      shop,
      published: shop.published,
      offersPublished: published,
      offersWeek: weekOffers,
      reservations: reservas.length,
      confirmationRate: percent(confirmed, reservas.length),
      pickupRate: percent(picked, confirmed || reservas.length),
      funnel: {
        scans: scans.length,
        browsedNoReserve,
        reservations: scanReserved,
        pickups: scanPicked,
      },
    };
  });

  const recentPublications = state.offers
    .filter((o) => o.publishedAt)
    .sort(
      (a, b) =>
        new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime()
    )
    .slice(0, 12)
    .map((o) => ({
      ...o,
      shopName: shops.find((s) => s.id === o.shopId)?.name || "",
    }));

  const totalScans = state.scans.length;
  const totalBrowsedNoReserve = state.scans.filter(
    (s) => s.browsed && !s.reserved
  ).length;
  const totalReserved = state.scans.filter((s) => s.reserved).length;
  const totalPickups = state.scans.filter((s) => s.pickedUp).length;

  return {
    liveClients: getLiveClients(),
    shopsCount: shops.length,
    publishedShops: shops.filter((s) => s.published).length,
    offersToday: state.offers.filter((o) => {
      const d = new Date(o.publishedAt || o.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
    reservationsToday: state.reservations.filter((r) => {
      const d = new Date(r.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
    perShop,
    recentPublications,
    funnel: {
      scans: totalScans,
      browsedNoReserve: totalBrowsedNoReserve,
      reservations: totalReserved,
      pickups: totalPickups,
    },
    alerts: state.alerts,
  };
}

export function getMerchantKPIs(shopId: string) {
  const offers = getOffers({ shopId });
  const reservas = getReservations({ shopId });
  const today = new Date().toDateString();
  const active = offers.filter((o) => o.status === "PUBLIEE").length;
  const todayResas = reservas.filter(
    (r) => new Date(r.createdAt).toDateString() === today
  ).length;
  const picked = reservas.filter((r) => r.status === "RECUPEREE").length;
  const views = offers.reduce((s, o) => s + o.views, 0);
  const pending = reservas.filter((r) => r.status === "EN_ATTENTE").length;
  return { active, todayResas, picked, views, pending };
}

type LocalFounderMessage = import("./types").FounderMessage;

declare global {
  // eslint-disable-next-line no-var
  var __epicerieClubFounderMessages: LocalFounderMessage[] | undefined;
}

function founderMessages(): LocalFounderMessage[] {
  if (!global.__epicerieClubFounderMessages) {
    global.__epicerieClubFounderMessages = [];
  }
  return global.__epicerieClubFounderMessages;
}

export function createFounderMessage(input: {
  shopId: string;
  body?: string;
  audioUrl?: string;
}): LocalFounderMessage {
  const shop = getShop(input.shopId);
  const msg: LocalFounderMessage = {
    id: generateId("fmsg"),
    shopId: input.shopId,
    shopName: shop?.name,
    body: input.body,
    audioUrl: input.audioUrl,
    status: "nouveau",
    createdAt: new Date().toISOString(),
  };
  founderMessages().unshift(msg);
  return msg;
}

export function getFounderMessages(): LocalFounderMessage[] {
  return [...founderMessages()];
}

export function updateFounderMessageStatus(
  id: string,
  status: import("./types").FounderMessageStatus
): LocalFounderMessage | undefined {
  const list = founderMessages();
  const idx = list.findIndex((m) => m.id === id);
  if (idx < 0) return undefined;
  list[idx] = { ...list[idx], status };
  return list[idx];
}
