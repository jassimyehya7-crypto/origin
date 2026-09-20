import { LOCATIONS, MERCHANTS, mergeOffers, getMerchant } from "@/lib/data/catalog";
import type { CategoryId, LocationId, Offer } from "@/lib/types";

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
