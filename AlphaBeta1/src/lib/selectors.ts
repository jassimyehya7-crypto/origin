import { LOCATIONS, getActiveMerchants, mergeOffers, getMerchant } from "@/lib/data/catalog";
import type { CategoryId, LocationId, Merchant, Offer } from "@/lib/types";

/** Durée max des offres Flash en heures */
export const FLASH_MAX_HOURS = 6;
/** Durée max des offres Promo en heures */
export const PROMO_MAX_HOURS = 12;

/** Convertit "HH:MM" en minutes depuis minuit */
export function timeToMinutes(time: string): number {
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

  // Flash = disparaît complètement quand le commerce ferme
  if (!isMerchantOpen(merchant, now)) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const untilMinutes = timeToMinutes(offer.until);

  // Flash expire à l'heure until ou à la fermeture du commerce (le plus tôt)
  const closeMinutes = timeToMinutes(merchant.openUntil);
  const effectiveEnd = Math.min(untilMinutes, closeMinutes);

  return currentMinutes < effectiveEnd;
}

/** Vérifie si une offre est en "pause nuit" (commerce fermé mais offre encore valide demain) */
export function isOfferPaused(offer: Offer, now: Date = new Date()): boolean {
  const merchant = getMerchant(offer.merchantId);
  if (!merchant) return false;
  if (isMerchantOpen(merchant, now)) return false; // Commerce ouvert → pas en pause

  // Les offres flash ne se mettent pas en pause — elles disparaissent
  if (offer.flags.includes("flash")) return false;

  // Les autres offres (promo, hot, new) se mettent en pause
  return true;
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
  now?: Date;
}) {
  const q = (opts.query ?? "").trim().toLowerCase();
  const pool = mergeOffers(opts.extraOffers ?? [], opts.hiddenOfferIds ?? []);
  const now = opts.now ?? new Date();

  return pool
    .filter((offer) => {
      const merchant = getMerchant(offer.merchantId);
      if (!merchant) return false;
      if (!matchesCategory(offer, opts.category)) return false;
      const d = offerDistance(offer, opts.locationId);
      if (!inRadius(d, opts.radiusKm)) return false;

      const open = isMerchantOpen(merchant, now);

      // --- OFFRES FLASH ---
      // Flash = éphémère. Si commerce fermé OU heure until dépassée → disparaît.
      if (offer.flags.includes("flash")) {
        if (!open) return false; // Commerce fermé → flash disparaît
        if (offer.until) {
          const untilMin = timeToMinutes(offer.until);
          const currentMin = now.getHours() * 60 + now.getMinutes();
          if (currentMin >= untilMin) return false; // Heure dépassée → flash disparaît
        }
        // Vérifier le stock
        const stock = opts.stockByOffer[offer.id] ?? offer.stock;
        if (stock < 1) return false;
        return true;
      }

      // --- OFFRES PROMO / HOT / NEW ---
      // Ces offres survivent à la fermeture du commerce (pause nuit).
      // Elles disparaissent uniquement si :
      // 1. Stock épuisé
      // 2. Commerce ouvert ET heure until dépassée (expirée en journée)
      const stock = opts.stockByOffer[offer.id] ?? offer.stock;
      if (stock < 1) return false; // Stock épuisé → disparaît

      if (open && offer.until) {
        const untilMin = timeToMinutes(offer.until);
        const currentMin = now.getHours() * 60 + now.getMinutes();
        if (currentMin >= untilMin) return false; // Expirée en journée → disparaît
      }

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
  return getActiveMerchants().filter((m) => {
    if (!inRadius(m.distanceM + extra, opts.radiusKm)) return false;
    if (q && !`${m.name} ${m.about} ${m.address}`.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => a.distanceM - b.distanceM);
}
