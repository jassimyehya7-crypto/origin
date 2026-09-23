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
  if (now.getDay() === 0) return false;
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

/** Temps réellement écoulé pendant les heures d'ouverture du commerce. */
function elapsedOpenMinutes(offer: Offer, merchant: Merchant, now: Date): number {
  if (!offer.createdAt) return 0;
  const start = new Date(offer.createdAt);
  if (!Number.isFinite(start.getTime()) || now <= start) return 0;

  let elapsed = 0;
  const day = new Date(start);
  day.setHours(0, 0, 0, 0);
  const lastDay = new Date(now);
  lastDay.setHours(0, 0, 0, 0);
  const openMinutes = timeToMinutes(merchant.openFrom);
  const closeMinutes = timeToMinutes(merchant.openUntil);

  while (day <= lastDay) {
    const opening = new Date(day);
    opening.setMinutes(openMinutes);
    const closing = new Date(day);
    closing.setMinutes(closeMinutes);
    const from = Math.max(start.getTime(), opening.getTime());
    const to = Math.min(now.getTime(), closing.getTime());
    if (to > from) elapsed += (to - from) / 60000;
    day.setDate(day.getDate() + 1);
  }
  return elapsed;
}

export function isDurationOfferValid(offer: Offer, now: Date = new Date()): boolean {
  if (offer.availabilityMode !== "duration" || !offer.durationMinutes) return true;
  const merchant = getMerchant(offer.merchantId);
  if (!merchant) return false;
  return elapsedOpenMinutes(offer, merchant, now) < offer.durationMinutes;
}

export function isOfferExpired(offer: Offer, now: Date = new Date()): boolean {
  if (offer.type === "FLASH" && offer.createdAt) {
    return new Date(offer.createdAt).toDateString() !== now.toDateString()
      || Boolean(offer.endsAt && new Date(offer.endsAt).getTime() <= now.getTime());
  }
  if (offer.availabilityMode === "duration") return !isDurationOfferValid(offer, now);
  return Boolean(offer.endsAt && new Date(offer.endsAt).getTime() <= now.getTime());
}

export function isOfferReservable(offer: Offer, stock: number, now: Date = new Date()): boolean {
  const merchant = getMerchant(offer.merchantId);
  return Boolean(merchant && isMerchantOpen(merchant, now) && stock > 0 && !isOfferExpired(offer, now));
}

export function extraMeters(locationId: LocationId) {
  return LOCATIONS.find((l) => l.id === locationId)?.extraM ?? 0;
}

/** Calcule la distance en mètres entre deux points GPS (Haversine) */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function offerDistance(offer: Offer, locationId: LocationId, userLat?: number | null, userLng?: number | null) {
  const merchant = getMerchant(offer.merchantId);
  if (!merchant) return 99999;
  // Si position GPS utilisateur disponible → distance réelle
  if (userLat != null && userLng != null) {
    return haversineMeters(userLat, userLng, merchant.lat, merchant.lng);
  }
  // Sinon → distance pré-calculée + extra
  return merchant.distanceM + extraMeters(locationId);
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
  userLat?: number | null;
  userLng?: number | null;
}) {
  const q = (opts.query ?? "").trim().toLowerCase();
  const pool = mergeOffers(opts.extraOffers ?? [], opts.hiddenOfferIds ?? []);
  const now = opts.now ?? new Date();

  return pool
    .filter((offer) => {
      const merchant = getMerchant(offer.merchantId);
      if (!merchant) return false;
      if (!matchesCategory(offer, opts.category)) return false;
      const d = offerDistance(offer, opts.locationId, opts.userLat, opts.userLng);
      if (!inRadius(d, opts.radiusKm)) return false;

      const open = isMerchantOpen(merchant, now);

      if (isOfferExpired(offer, now)) return false;

      if (!isDurationOfferValid(offer, now)) return false;

      // --- OFFRES FLASH ---
      // Flash = éphémère. Si commerce fermé OU heure until dépassée → disparaît.
      if (offer.flags.includes("flash")) {
        if (!open) return false; // Commerce fermé → flash disparaît
        if (offer.until && !offer.endsAt) {
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
      if (offer.availabilityMode !== "duration" && stock < 1) return false; // Lots épuisés → disparaît

      if (open && offer.until && !offer.endsAt && offer.availabilityMode !== "duration") {
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
    .sort((a, b) => offerDistance(a, opts.locationId, opts.userLat, opts.userLng) - offerDistance(b, opts.locationId, opts.userLat, opts.userLng));
}

export function visibleMerchants(opts: {
  locationId: LocationId;
  radiusKm: number;
  query?: string;
  userLat?: number | null;
  userLng?: number | null;
}) {
  const extra = extraMeters(opts.locationId);
  const q = (opts.query ?? "").trim().toLowerCase();
  return getActiveMerchants().filter((m) => {
    const dist = opts.userLat != null && opts.userLng != null
      ? haversineMeters(opts.userLat, opts.userLng, m.lat, m.lng)
      : m.distanceM + extra;
    if (!inRadius(dist, opts.radiusKm)) return false;
    if (q && !`${m.name} ${m.about} ${m.address}`.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => {
    if (opts.userLat != null && opts.userLng != null) {
      return haversineMeters(opts.userLat, opts.userLng, a.lat, a.lng) - haversineMeters(opts.userLat, opts.userLng, b.lat, b.lng);
    }
    return a.distanceM - b.distanceM;
  });
}
