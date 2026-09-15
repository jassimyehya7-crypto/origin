/**
 * Store façade — prefers Supabase when NEXT_PUBLIC_SUPABASE_* is set,
 * otherwise falls back to the in-memory LocalStoreAdapter (store-local).
 *
 * All exports are async so callers stay identical across adapters.
 */
import { isSupabaseConfigured } from "@/lib/supabase/env";
import * as local from "./store-local";
import * as remote from "./store-supabase";
import type {
  AppState,
  Offer,
  OfferType,
  Reservation,
  ReservationStatus,
  Shop,
} from "./types";

function preferSupabase() {
  return isSupabaseConfigured();
}

export function usingSupabase(): boolean {
  return preferSupabase();
}

export async function resetDemo(): Promise<AppState> {
  return preferSupabase() ? remote.resetDemo() : local.resetDemo();
}

export async function getStore(): Promise<AppState> {
  return preferSupabase() ? remote.getStore() : Promise.resolve(local.getStore());
}

export async function getShops(): Promise<Shop[]> {
  return preferSupabase() ? remote.getShops() : Promise.resolve(local.getShops());
}

export async function getShop(id: string): Promise<Shop | undefined> {
  return preferSupabase()
    ? remote.getShop(id)
    : Promise.resolve(local.getShop(id));
}

export async function getShopBySlug(slug: string): Promise<Shop | undefined> {
  return preferSupabase()
    ? remote.getShopBySlug(slug)
    : Promise.resolve(local.getShopBySlug(slug));
}

export async function updateShop(
  id: string,
  patch: Partial<Shop>
): Promise<Shop | undefined> {
  return preferSupabase()
    ? remote.updateShop(id, patch)
    : Promise.resolve(local.updateShop(id, patch));
}

export async function getOffers(opts?: {
  shopId?: string;
  status?: string;
  publishedOnly?: boolean;
}): Promise<Offer[]> {
  return preferSupabase()
    ? remote.getOffers(opts)
    : Promise.resolve(local.getOffers(opts));
}

export async function getOffer(id: string): Promise<Offer | undefined> {
  return preferSupabase()
    ? remote.getOffer(id)
    : Promise.resolve(local.getOffer(id));
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
  imageUrl?: string;
  publish?: boolean;
}): Promise<Offer> {
  return preferSupabase()
    ? remote.createOffer(input)
    : Promise.resolve(local.createOffer(input));
}

export async function updateOffer(
  id: string,
  patch: Partial<Offer>
): Promise<Offer | undefined> {
  return preferSupabase()
    ? remote.updateOffer(id, patch)
    : Promise.resolve(local.updateOffer(id, patch));
}

export async function publishOffer(id: string): Promise<Offer | undefined> {
  return preferSupabase()
    ? remote.publishOffer(id)
    : Promise.resolve(local.publishOffer(id));
}

export async function deleteOffer(id: string): Promise<Offer | undefined> {
  return preferSupabase()
    ? remote.deleteOffer(id)
    : Promise.resolve(local.deleteOffer(id));
}

export async function incrementOfferViews(id: string): Promise<void> {
  if (preferSupabase()) return remote.incrementOfferViews(id);
  local.incrementOfferViews(id);
}

export async function getReservations(opts?: {
  shopId?: string;
  offerId?: string;
  clientPhone?: string;
  softUserId?: string;
  status?: string;
}): Promise<Reservation[]> {
  return preferSupabase()
    ? remote.getReservations(opts)
    : Promise.resolve(local.getReservations(opts));
}

export async function getReservation(
  id: string
): Promise<Reservation | undefined> {
  return preferSupabase()
    ? remote.getReservation(id)
    : Promise.resolve(local.getReservation(id));
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
  return preferSupabase()
    ? remote.createReservation(input)
    : local.createReservation(input);
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<
  { ok: true; reservation: Reservation } | { ok: false; error: string }
> {
  return preferSupabase()
    ? remote.updateReservationStatus(id, status)
    : local.updateReservationStatus(id, status);
}

export async function cancelExpiredConfirmed(): Promise<number> {
  return preferSupabase()
    ? remote.cancelExpiredConfirmed()
    : local.cancelExpiredConfirmed();
}

export async function expireConfirmedRemaining(shopId?: string): Promise<number> {
  return preferSupabase()
    ? remote.expireConfirmedRemaining(shopId)
    : local.expireConfirmedRemaining(shopId);
}

export async function ensureShopDayClosed(
  shopId: string
): Promise<{ expiredReservations: number; expiredOffers: number }> {
  return preferSupabase()
    ? remote.ensureShopDayClosed(shopId)
    : local.ensureShopDayClosed(shopId);
}

export async function getFavorites() {
  return preferSupabase()
    ? remote.getFavorites()
    : Promise.resolve(local.getFavorites());
}

export async function toggleFavorite(shopId: string): Promise<boolean> {
  return preferSupabase()
    ? remote.toggleFavorite(shopId)
    : Promise.resolve(local.toggleFavorite(shopId));
}

export async function recordScan(shopSlug: string, sessionId?: string) {
  return preferSupabase()
    ? remote.recordScan(shopSlug, sessionId)
    : Promise.resolve(local.recordScan(shopSlug, sessionId));
}

export async function markScanBrowsed(sessionId: string, shopSlug: string) {
  if (preferSupabase()) return remote.markScanBrowsed(sessionId, shopSlug);
  local.markScanBrowsed(sessionId, shopSlug);
}

export async function heartbeat(sessionId: string, page: string) {
  return preferSupabase()
    ? remote.heartbeat(sessionId, page)
    : Promise.resolve(local.heartbeat(sessionId, page));
}

export async function getLiveClients(): Promise<number> {
  return preferSupabase()
    ? remote.getLiveClients()
    : Promise.resolve(local.getLiveClients());
}

export async function getFounderStats() {
  return preferSupabase()
    ? remote.getFounderStats()
    : Promise.resolve(local.getFounderStats());
}

export async function getMerchantKPIs(shopId: string) {
  return preferSupabase()
    ? remote.getMerchantKPIs(shopId)
    : Promise.resolve(local.getMerchantKPIs(shopId));
}

export async function createFounderMessage(input: {
  shopId: string;
  body?: string;
  audioUrl?: string;
}) {
  return preferSupabase()
    ? remote.createFounderMessage(input)
    : Promise.resolve(local.createFounderMessage(input));
}

export async function getFounderMessages() {
  return preferSupabase()
    ? remote.getFounderMessages()
    : Promise.resolve(local.getFounderMessages());
}

export async function updateFounderMessageStatus(
  id: string,
  status: import("./types").FounderMessageStatus
) {
  return preferSupabase()
    ? remote.updateFounderMessageStatus(id, status)
    : Promise.resolve(local.updateFounderMessageStatus(id, status));
}
