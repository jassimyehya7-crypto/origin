import { createServerClient } from "@/lib/supabase/server";
import { DEMO_CLIENT, DEMO_CLIENT_ID } from "@/lib/supabase/env";
import {
  offerToRow,
  reservationToRow,
  rowToFavorite,
  rowToOffer,
  rowToPresence,
  rowToReservation,
  rowToScan,
  rowToShop,
  scanToRow,
  shopToRow,
  type EcFavoriteRow,
  type EcOfferRow,
  type EcPresenceRow,
  type EcReservationRow,
  type EcScanRow,
  type EcShopRow,
} from "@/lib/supabase/mappers";
import { createInitialState } from "@/lib/seed";
import type {
  AppState,
  Offer,
  OfferType,
  Reservation,
  ReservationStatus,
  Shop,
} from "@/lib/types";
import { generateCode, generateId, percent } from "@/lib/utils";
import {
  decrementStrike,
  isPaused,
  linkReservationSoftId,
  recordNoShow,
  resetStrikesDemo,
} from "@/lib/phone-risk";
import { resolveClientName } from "@/lib/soft-profile";

function sb() {
  const client = createServerClient();
  if (!client) throw new Error("Supabase non configuré");
  return client;
}

function sortOffers(offers: Offer[]): Offer[] {
  return [...offers].sort(
    (a, b) =>
      new Date(b.publishedAt || b.createdAt).getTime() -
      new Date(a.publishedAt || a.createdAt).getTime()
  );
}

function sortReservations(list: Reservation[]): Reservation[] {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getShops(): Promise<Shop[]> {
  const { data, error } = await sb().from("ec_shops").select("*");
  if (error) throw error;
  return (data as EcShopRow[]).map(rowToShop);
}

export async function getShop(id: string): Promise<Shop | undefined> {
  const { data, error } = await sb()
    .from("ec_shops")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToShop(data as EcShopRow) : undefined;
}

export async function getShopBySlug(slug: string): Promise<Shop | undefined> {
  const { data, error } = await sb()
    .from("ec_shops")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToShop(data as EcShopRow) : undefined;
}

export async function updateShop(
  id: string,
  patch: Partial<Shop>
): Promise<Shop | undefined> {
  const current = await getShop(id);
  if (!current) return undefined;
  const next = { ...current, ...patch };
  const { data, error } = await sb()
    .from("ec_shops")
    .update(shopToRow(next))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return rowToShop(data as EcShopRow);
}

export async function getOffers(opts?: {
  shopId?: string;
  status?: string;
  publishedOnly?: boolean;
}): Promise<Offer[]> {
  let q = sb().from("ec_offers").select("*");
  if (opts?.shopId) q = q.eq("shop_id", opts.shopId);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.publishedOnly) q = q.eq("status", "PUBLIEE");
  const { data, error } = await q;
  if (error) throw error;
  return sortOffers((data as EcOfferRow[]).map(rowToOffer));
}

export async function getOffer(id: string): Promise<Offer | undefined> {
  const { data, error } = await sb()
    .from("ec_offers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToOffer(data as EcOfferRow) : undefined;
}

export async function createOffer(input: {
  shopId: string;
  title: string;
  description: string;
  type: OfferType;
  price: number;
  originalPrice?: number;
  quantityTotal: number;
  unit: string;
  emoji?: string;
  publish?: boolean;
}): Promise<Offer> {
  const shop = await getShop(input.shopId);
  const now = new Date().toISOString();
  const validUntil = (() => {
    const d = new Date();
    const [h, m] = (shop?.openUntil || "19:00").split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  })();
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
    unit: input.unit || "lot",
    emoji: input.emoji || "🛍️",
    validUntil,
    createdAt: now,
    publishedAt: input.publish ? now : undefined,
    views: 0,
  };
  const { data, error } = await sb()
    .from("ec_offers")
    .insert({ ...offerToRow(offer), created_at: now })
    .select("*")
    .single();
  if (error) throw error;
  return rowToOffer(data as EcOfferRow);
}

export async function updateOffer(
  id: string,
  patch: Partial<Offer>
): Promise<Offer | undefined> {
  const current = await getOffer(id);
  if (!current) return undefined;
  const next = { ...current, ...patch };
  const { data, error } = await sb()
    .from("ec_offers")
    .update(offerToRow(next))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return rowToOffer(data as EcOfferRow);
}

export async function publishOffer(id: string): Promise<Offer | undefined> {
  const offer = await getOffer(id);
  if (!offer) return undefined;
  return updateOffer(id, {
    status: "PUBLIEE",
    publishedAt: new Date().toISOString(),
  });
}

export async function incrementOfferViews(id: string): Promise<void> {
  const offer = await getOffer(id);
  if (!offer) return;
  await updateOffer(id, { views: offer.views + 1 });
}

export async function getReservations(opts?: {
  shopId?: string;
  offerId?: string;
  clientPhone?: string;
}): Promise<Reservation[]> {
  let q = sb().from("ec_reservations").select("*");
  if (opts?.shopId) q = q.eq("shop_id", opts.shopId);
  if (opts?.offerId) q = q.eq("offer_id", opts.offerId);
  if (opts?.clientPhone) q = q.eq("client_phone", opts.clientPhone);
  const { data, error } = await q;
  if (error) throw error;
  return sortReservations((data as EcReservationRow[]).map(rowToReservation));
}

export async function getReservation(
  id: string
): Promise<Reservation | undefined> {
  const { data, error } = await sb()
    .from("ec_reservations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToReservation(data as EcReservationRow) : undefined;
}

async function restoreStock(offerId: string, qty: number) {
  const offer = await getOffer(offerId);
  if (!offer) return;
  const quantityLeft = offer.quantityLeft + qty;
  await updateOffer(offerId, {
    quantityLeft,
    status:
      offer.status === "EPUISEE" && quantityLeft > 0 ? "PUBLIEE" : offer.status,
  });
}

async function decrementStock(offerId: string, qty: number): Promise<boolean> {
  const offer = await getOffer(offerId);
  if (!offer) return false;
  if (offer.status !== "PUBLIEE" || offer.quantityLeft < qty) return false;
  const quantityLeft = offer.quantityLeft - qty;
  await updateOffer(offerId, {
    quantityLeft,
    status: quantityLeft === 0 ? "EPUISEE" : offer.status,
  });
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
}): Promise<
  { ok: true; reservation: Reservation } | { ok: false; error: string }
> {
  const offer = await getOffer(input.offerId);
  if (!offer) return { ok: false, error: "Offre introuvable" };
  if (offer.status !== "PUBLIEE")
    return { ok: false, error: "Cette offre n'est plus disponible" };
  if (input.quantity < 1) return { ok: false, error: "Quantité invalide" };
  if (offer.quantityLeft < input.quantity)
    return { ok: false, error: "Stock insuffisant" };

  const clientPhone =
    typeof input.clientPhone === "string" ? input.clientPhone.trim() : "";
  const softUserId =
    typeof input.softUserId === "string" ? input.softUserId.trim() : "";
  const pause = isPaused({ phone: clientPhone, softUserId });
  if (pause.paused) {
    return { ok: false, error: pause.message || "Réservation en pause" };
  }

  const ok = await decrementStock(offer.id, input.quantity);
  if (!ok) return { ok: false, error: "Stock insuffisant" };

  const now = new Date().toISOString();
  const reservation: Reservation = {
    id: generateId("resa"),
    offerId: offer.id,
    shopId: offer.shopId,
    clientName: resolveClientName(input.clientName),
    clientPhone,
    softUserId: softUserId || undefined,
    quantity: input.quantity,
    status: "EN_ATTENTE",
    code: generateCode(),
    message: input.message,
    createdAt: now,
    updatedAt: now,
  };
  if (softUserId) linkReservationSoftId(reservation.id, softUserId);

  const { data, error } = await sb()
    .from("ec_reservations")
    .insert(reservationToRow(reservation))
    .select("*")
    .single();
  if (error) {
    await restoreStock(offer.id, input.quantity);
    throw error;
  }

  if (input.scanSessionId) {
    const { data: scans } = await sb()
      .from("ec_scans")
      .select("*")
      .eq("session_id", input.scanSessionId)
      .limit(1);
    const scan = (scans as EcScanRow[] | null)?.[0];
    if (scan) {
      await sb()
        .from("ec_scans")
        .update({
          reserved: true,
          browsed: true,
          browsed_no_reserve: false,
        })
        .eq("id", scan.id);
    }
  }

  return { ok: true, reservation: rowToReservation(data as EcReservationRow) };
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<
  { ok: true; reservation: Reservation } | { ok: false; error: string }
> {
  const current = await getReservation(id);
  if (!current) return { ok: false, error: "Réservation introuvable" };

  const now = new Date().toISOString();
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
    await restoreStock(current.offerId, current.quantity);
  }

  const updated: Reservation = {
    ...current,
    status,
    updatedAt: now,
    confirmedAt: status === "CONFIRMEE" ? now : current.confirmedAt,
    pickedUpAt: status === "RECUPEREE" ? now : current.pickedUpAt,
  };

  const { data, error } = await sb()
    .from("ec_reservations")
    .update(reservationToRow(updated))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  if (status === "RECUPEREE") {
    const { data: scans } = await sb()
      .from("ec_scans")
      .select("*")
      .eq("shop_id", updated.shopId)
      .eq("reserved", true)
      .eq("picked_up", false)
      .limit(1);
    const scan = (scans as EcScanRow[] | null)?.[0];
    if (scan) {
      await sb()
        .from("ec_scans")
        .update({ picked_up: true })
        .eq("id", scan.id);
    }
    if (current.status === "NON_RECUPEREE") {
      decrementStrike({
        phone: updated.clientPhone,
        softUserId: updated.softUserId,
        reservationId: updated.id,
      });
    }
  }

  if (status === "NON_RECUPEREE" && current.status !== "NON_RECUPEREE") {
    recordNoShow({
      phone: updated.clientPhone,
      softUserId: updated.softUserId,
      reservationId: updated.id,
    });
  }

  return { ok: true, reservation: rowToReservation(data as EcReservationRow) };
}

export async function getFavorites() {
  const { data, error } = await sb()
    .from("ec_favorites")
    .select("*")
    .eq("client_id", DEMO_CLIENT_ID);
  if (error) throw error;
  return (data as EcFavoriteRow[]).map(rowToFavorite);
}

export async function toggleFavorite(shopId: string): Promise<boolean> {
  const { data: existing } = await sb()
    .from("ec_favorites")
    .select("*")
    .eq("client_id", DEMO_CLIENT_ID)
    .eq("shop_id", shopId)
    .maybeSingle();
  if (existing) {
    await sb()
      .from("ec_favorites")
      .delete()
      .eq("client_id", DEMO_CLIENT_ID)
      .eq("shop_id", shopId);
    return false;
  }
  await sb().from("ec_favorites").insert({
    client_id: DEMO_CLIENT_ID,
    shop_id: shopId,
    created_at: new Date().toISOString(),
  });
  return true;
}

export async function recordScan(shopSlug: string, sessionId?: string) {
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return null;
  const sid = sessionId || generateId("sess");
  const { data: existing } = await sb()
    .from("ec_scans")
    .select("*")
    .eq("session_id", sid)
    .eq("shop_slug", shopSlug)
    .maybeSingle();
  if (existing) return rowToScan(existing as EcScanRow);

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
  const { data, error } = await sb()
    .from("ec_scans")
    .insert(scanToRow(scan))
    .select("*")
    .single();
  if (error) throw error;
  return rowToScan(data as EcScanRow);
}

export async function markScanBrowsed(sessionId: string, shopSlug: string) {
  const { data } = await sb()
    .from("ec_scans")
    .select("*")
    .eq("session_id", sessionId)
    .eq("shop_slug", shopSlug)
    .maybeSingle();
  if (!data) return;
  const scan = data as EcScanRow;
  await sb()
    .from("ec_scans")
    .update({
      browsed: true,
      browsed_no_reserve: !scan.reserved,
    })
    .eq("id", scan.id);
}

export async function heartbeat(sessionId: string, page: string) {
  const now = new Date().toISOString();
  await sb().from("ec_presence").upsert({
    client_id: sessionId,
    last_seen: now,
    page,
  });
  const cutoff = new Date(Date.now() - 2 * 60_000).toISOString();
  await sb().from("ec_presence").delete().lt("last_seen", cutoff);
  return getLiveClients();
}

export async function getLiveClients(): Promise<number> {
  const cutoff = new Date(Date.now() - 2 * 60_000).toISOString();
  const { data, error } = await sb()
    .from("ec_presence")
    .select("client_id")
    .gt("last_seen", cutoff);
  if (error) throw error;
  return data?.length ?? 0;
}

export async function getFounderStats() {
  const [shops, offers, reservations, scans, liveClients] = await Promise.all([
    getShops(),
    getOffers(),
    getReservations(),
    (async () => {
      const { data, error } = await sb().from("ec_scans").select("*");
      if (error) throw error;
      return (data as EcScanRow[]).map(rowToScan);
    })(),
    getLiveClients(),
  ]);

  const perShop = shops.map((shop) => {
    const shopOffers = offers.filter((o) => o.shopId === shop.id);
    const published = shopOffers.filter((o) => o.status === "PUBLIEE").length;
    const weekOffers = shopOffers.filter((o) => {
      const d = new Date(o.createdAt).getTime();
      return Date.now() - d < 7 * 24 * 3600_000;
    }).length;
    const reservas = reservations.filter((r) => r.shopId === shop.id);
    const confirmed = reservas.filter((r) =>
      ["CONFIRMEE", "RECUPEREE"].includes(r.status)
    ).length;
    const picked = reservas.filter((r) => r.status === "RECUPEREE").length;
    const shopScans = scans.filter((s) => s.shopId === shop.id);
    const browsedNoReserve = shopScans.filter(
      (s) => s.browsed && !s.reserved
    ).length;
    const scanReserved = shopScans.filter((s) => s.reserved).length;
    const scanPicked = shopScans.filter((s) => s.pickedUp).length;

    return {
      shop,
      published: shop.published,
      offersPublished: published,
      offersWeek: weekOffers,
      reservations: reservas.length,
      confirmationRate: percent(confirmed, reservas.length),
      pickupRate: percent(picked, confirmed || reservas.length),
      funnel: {
        scans: shopScans.length,
        browsedNoReserve,
        reservations: scanReserved,
        pickups: scanPicked,
      },
    };
  });

  const recentPublications = offers
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

  const totalScans = scans.length;
  const totalBrowsedNoReserve = scans.filter(
    (s) => s.browsed && !s.reserved
  ).length;
  const totalReserved = scans.filter((s) => s.reserved).length;
  const totalPickups = scans.filter((s) => s.pickedUp).length;

  const alerts = [
    ...offers
      .filter((o) => o.status === "EPUISEE")
      .slice(0, 3)
      .map((o) => ({
        id: `alert_ex_${o.id}`,
        type: "warning" as const,
        title: "Offre épuisée",
        message: `${o.title} est épuisée.`,
        createdAt: o.publishedAt || o.createdAt,
        shopId: o.shopId,
      })),
    ...shops
      .filter((s) => !s.published)
      .slice(0, 2)
      .map((s) => ({
        id: `alert_np_${s.id}`,
        type: "info" as const,
        title: "Commerce non publié",
        message: `${s.name} est en liste mais pas encore publié.`,
        createdAt: new Date().toISOString(),
        shopId: s.id,
      })),
  ];

  return {
    liveClients,
    shopsCount: shops.length,
    publishedShops: shops.filter((s) => s.published).length,
    offersToday: offers.filter((o) => {
      const d = new Date(o.publishedAt || o.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
    reservationsToday: reservations.filter((r) => {
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
    alerts,
  };
}

export async function getMerchantKPIs(shopId: string) {
  const offers = await getOffers({ shopId });
  const reservas = await getReservations({ shopId });
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

export async function getStore(): Promise<AppState> {
  const [shops, offers, reservations, favorites, scans, presence] =
    await Promise.all([
      getShops(),
      getOffers(),
      getReservations(),
      getFavorites(),
      (async () => {
        const { data, error } = await sb().from("ec_scans").select("*");
        if (error) throw error;
        return (data as EcScanRow[]).map(rowToScan);
      })(),
      (async () => {
        const { data, error } = await sb().from("ec_presence").select("*");
        if (error) throw error;
        return (data as EcPresenceRow[]).map(rowToPresence);
      })(),
    ]);

  return {
    shops,
    offers,
    reservations,
    favorites,
    scans,
    presence,
    client: DEMO_CLIENT,
    alerts: [],
    seededAt: new Date().toISOString(),
  };
}

/** Wipe + re-upsert seed data into ec_* tables. */
export async function resetDemo(): Promise<AppState> {
  resetStrikesDemo();
  const state = createInitialState();
  const client = sb();

  // Order matters for FKs
  await client.from("ec_reservations").delete().neq("id", "");
  await client.from("ec_favorites").delete().neq("client_id", "");
  await client.from("ec_scans").delete().neq("id", "");
  await client.from("ec_presence").delete().neq("client_id", "");
  await client.from("ec_offers").delete().neq("id", "");
  await client.from("ec_shops").delete().neq("id", "");

  const { error: shopErr } = await client
    .from("ec_shops")
    .upsert(state.shops.map(shopToRow));
  if (shopErr) throw shopErr;

  const { error: offerErr } = await client
    .from("ec_offers")
    .upsert(
      state.offers.map((o) => ({ ...offerToRow(o), created_at: o.createdAt }))
    );
  if (offerErr) throw offerErr;

  const { error: resaErr } = await client
    .from("ec_reservations")
    .upsert(state.reservations.map(reservationToRow));
  if (resaErr) throw resaErr;

  if (state.scans.length) {
    const { error: scanErr } = await client
      .from("ec_scans")
      .upsert(state.scans.map(scanToRow));
    if (scanErr) throw scanErr;
  }

  if (state.favorites.length) {
    const { error: favErr } = await client.from("ec_favorites").upsert(
      state.favorites.map((f) => ({
        client_id: DEMO_CLIENT_ID,
        shop_id: f.shopId,
        created_at: f.addedAt,
      }))
    );
    if (favErr) throw favErr;
  }

  if (state.presence.length) {
    const { error: preErr } = await client.from("ec_presence").upsert(
      state.presence.map((p) => ({
        client_id: p.sessionId,
        last_seen: p.lastSeen,
        page: p.page,
      }))
    );
    if (preErr) throw preErr;
  }

  return getStore();
}

export async function cancelExpiredConfirmed(): Promise<number> {
  // Default without Pro gesture = EXPIREE (0 strike). NEVER auto-NON_RECUPEREE.
  const reservations = await getReservations();
  const offers = await getOffers();
  const now = Date.now();
  let count = 0;
  for (const resa of reservations) {
    if (resa.status !== "CONFIRMEE") continue;
    const offer = offers.find((o) => o.id === resa.offerId);
    if (!offer) continue;
    if (new Date(offer.validUntil).getTime() < now) {
      await updateReservationStatus(resa.id, "EXPIREE");
      count++;
    }
  }
  return count;
}

export async function expireConfirmedRemaining(shopId?: string): Promise<number> {
  const reservations = await getReservations(
    shopId ? { shopId } : undefined
  );
  let count = 0;
  for (const resa of reservations) {
    if (resa.status !== "CONFIRMEE") continue;
    await updateReservationStatus(resa.id, "EXPIREE");
    count++;
  }
  return count;
}
