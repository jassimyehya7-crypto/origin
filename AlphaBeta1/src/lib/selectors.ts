import { LOCATIONS, MERCHANTS, mergeOffers, getMerchant } from "@/lib/data/catalog";
import type { CategoryId, LocationId, Merchant, Offer } from "@/lib/types";

/** Durée max des offres Flash en heures */
export const FLASH_MAX_HOURS = 6;
/** Durée max des offres Promo en heures */
export const PROMO_MAX_HOURS = 12;

/** Convertit "HH:MM" en minutes depuis minuit */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Vérifie si un commerce est actuellement ouvert */
export function isMerchantOpen(merchant: Merchant, now: Date = new Date()): boolean {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = timeToMinutes(merchant.openFrom);
  const closeMinutes = timeToMinutes(merchant.openUntil);

  if (openMinutes <= closeMinutes) {
    // Horaires normaux (ex: 08:00 → 19:00)
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else {
    // Horaires qui traversent minuit (ex: 22:00 → 02:00)
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }
}

/** Vérifie si une offre Flash est encore valide (max 6h depuis le début) */
export function isFlashOfferValid(offer: Offer, now: Date = new Date()): boolean {
  const merchant = getMerchant(offer.merchantId);
  if (!merchant) return false;
  if (!isMerchantOpen(merchant, now)) return false;

  // L'offre expire à merchant.openUntil ou après FLASH_MAX_HOURS
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = timeToMinutes(merchant.openFrom);
  const maxEndMinutes = openMinutes + FLASH_MAX_HOURS * 60;
  const closeMinutes = timeToMinutes(merchant.openUntil);
  const effectiveEnd = Math.min(maxEndMinutes, closeMinutes);

  return currentMinutes < effectiveEnd;
}

/** Vérifie si une offre est en "pause nuit" (commerce fermé mais offre encore valide demain) */
export function isOfferPaused(offer: Offer, now: Date = new Date()): boolean {
  const merchant = getMerchant(offer.merchantId);
  if (!merchant) return false;
  // Commerce fermé mais l'offre n'est pas expirée
  return !isMerchantOpen(merchant, now);
}

export function extraMeters(locationId: LocationId) {
  return LOCATIONS.find((l) => l.id === locationId)?.extraM ?? 0;
}

export function offerDistance(offer: Offer, locationId: LocationId) {
  const merchant = getMerchant(offer.merchantId);
  return (merchant?.distanceM ?? 0) + extraMeters(locationId);
}

export function merchantDistance(merchantId: string, locationId: LocationId) {
  const merchant = getMerchant(merchantId);
  return (merchant?.distanceM ?? 0) + extraMeters(locationId);
}

export function inRadius(meters: number, radiusKm: number) {
  return meters <= radiusKm * 1000;
}

export function matchesCategory(offer: Offer, category: CategoryId) {
  if (category === "all") return true;
  const merchant = getMerchant(offer.merchantId);
  return merchant?.category === category;
}

export function visibleOffers(opts: {
  locationId: LocationId;
  radiusKm: number;
  category: CategoryId;
  stockByOffer: Record<string, number>;
  query?: string;
  extraOffers?: Offer[];
  hiddenOfferIds?: string[];
}) {
  const q = (opts.query ?? "").trim().toLowerCase();
  const pool = mergeOffers(opts.extraOffers ?? [], opts.hiddenOfferIds ?? []);
  return pool
    .filter((offer) => {
      const merchant = getMerchant(offer.merchantId);
      if (!merchant) return false;
      if (!matchesCategory(offer, opts.category)) return false;
      const d = offerDistance(offer, opts.locationId);
      if (!inRadius(d, opts.radiusKm)) return false;
      if (q) {
        const hay = `${offer.title} ${merchant.name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => offerDistance(a, opts.locationId) - offerDistance(b, opts.locationId));
}

export function visibleMerchants(opts: {
  locationId: LocationId;
  radiusKm: number;
  query?: string;
}) {
  const extra = extraMeters(opts.locationId);
  const q = (opts.query ?? "").trim().toLowerCase();
  return MERCHANTS.filter((m) => {
    if (!inRadius(m.distanceM + extra, opts.radiusKm)) return false;
    if (q && !`${m.name} ${m.about} ${m.address}`.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => a.distanceM - b.distanceM);
}
