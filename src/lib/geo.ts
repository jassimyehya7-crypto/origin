/** Shared geo helpers for client location UX (fr-CH). */

export const FALLBACK_CITY = "Villeneuve";
export const FALLBACK_CANTON = "VD";
/** Pilot pin — Place de la Gare approx. */
export const FALLBACK_COORDS = { lat: 46.39705, lng: 6.9262 };

export type LatLng = { lat: number; lng: number };

export type ShopGeo = {
  id: string;
  city: string;
  lat: number;
  lng: number;
};

/** Strip accents / case for fuzzy city matching. */
export function normalizeCity(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function citiesMatch(a: string, b: string): boolean {
  const na = normalizeCity(a);
  const nb = normalizeCity(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // "villeneuve vd" vs "villeneuve"
  return na.startsWith(nb + " ") || nb.startsWith(na + " ");
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** fr-CH: &lt;1000 m → « 500 m », else « 1,2 km ». */
export function formatDistanceFr(meters: number): string {
  const m = Math.max(0, Math.round(meters));
  if (m < 1000) return `${m} m`;
  const km = m / 1000;
  const rounded =
    km >= 10 ? Math.round(km).toString() : km.toFixed(1).replace(".", ",");
  return `${rounded} km`;
}

const CANTON_BY_NAME: Record<string, string> = {
  vaud: "VD",
  geneve: "GE",
  genève: "GE",
  valais: "VS",
  fribourg: "FR",
  neuchatel: "NE",
  neuchâtel: "NE",
  berne: "BE",
  bern: "BE",
  zurich: "ZH",
  zürich: "ZH",
  "jura": "JU",
  ticino: "TI",
  tessin: "TI",
  aargau: "AG",
  argovie: "AG",
  "basel-stadt": "BS",
  "basel-landschaft": "BL",
  "saint-gall": "SG",
  "st. gallen": "SG",
  lucerne: "LU",
  luzern: "LU",
  thurgau: "TG",
  thurgovie: "TG",
  schwyz: "SZ",
  zug: "ZG",
  zoug: "ZG",
  soleure: "SO",
  solothurn: "SO",
  schaffhouse: "SH",
  schaffhausen: "SH",
  appenzell: "AI",
  glaris: "GL",
  glarus: "GL",
  uri: "UR",
  nidwald: "NW",
  nidwalden: "NW",
  obwald: "OW",
  obwalden: "OW",
  "grisons": "GR",
  graubunden: "GR",
  graubünden: "GR",
};

/** Extract Swiss canton code (VD, GE, …) from Nominatim address. */
export function pickCanton(
  address?: Record<string, string | undefined>
): string {
  if (!address) return FALLBACK_CANTON;
  const iso =
    address["ISO3166-2-lvl4"] ||
    address["ISO3166-2-lvl6"] ||
    address["ISO3166-2-lvl5"];
  if (iso && /^CH-[A-Z]{2}$/i.test(iso)) {
    return iso.slice(3).toUpperCase();
  }
  const state = address.state || address.county || "";
  const key = normalizeCity(state);
  if (CANTON_BY_NAME[key]) return CANTON_BY_NAME[key];
  // already a 2-letter code?
  if (/^[A-Za-z]{2}$/.test(state.trim())) return state.trim().toUpperCase();
  return FALLBACK_CANTON;
}

export function pickCityName(
  address?: Record<string, string | undefined>,
  fallback = FALLBACK_CITY
): string {
  if (!address) return fallback;
  const raw =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.city_district ||
    address.suburb ||
    fallback;
  return (raw || fallback).trim();
}

export type CoverageResult = {
  covered: boolean;
  /** City used for offer filtering (local if covered, else nearest shop city). */
  feedCity: string;
  nearestShop: ShopGeo | null;
  nearestDistanceM: number | null;
  feedShopIds: string[];
};

/**
 * If user's city matches any shop city → covered.
 * Else nearest published shop's city + distance to that shop.
 */
export function resolveCoverage(
  userCity: string,
  coords: LatLng,
  shops: ShopGeo[]
): CoverageResult {
  if (shops.length === 0) {
    return {
      covered: false,
      feedCity: FALLBACK_CITY,
      nearestShop: null,
      nearestDistanceM: null,
      feedShopIds: [],
    };
  }

  const localShops = shops.filter((s) => citiesMatch(s.city, userCity));
  if (localShops.length > 0) {
    return {
      covered: true,
      feedCity: localShops[0].city,
      nearestShop: null,
      nearestDistanceM: null,
      feedShopIds: localShops.map((s) => s.id),
    };
  }

  let nearest = shops[0];
  let nearestDist = haversineMeters(coords, nearest);
  for (let i = 1; i < shops.length; i++) {
    const d = haversineMeters(coords, shops[i]);
    if (d < nearestDist) {
      nearest = shops[i];
      nearestDist = d;
    }
  }

  const feedCity = nearest.city;
  const feedShopIds = shops
    .filter((s) => citiesMatch(s.city, feedCity))
    .map((s) => s.id);

  return {
    covered: false,
    feedCity,
    nearestShop: nearest,
    nearestDistanceM: nearestDist,
    feedShopIds,
  };
}
