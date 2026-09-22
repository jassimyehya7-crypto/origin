import { supabase } from "@/lib/supabase";
import type { Merchant, Offer, OfferFlag, OfferType, CategoryId } from "@/lib/types";

// Coordonnées de référence pour le calcul de distance (Villeneuve centre)
const REF_LAT = 46.3972;
const REF_LNG = 6.9265;

/** Calcule la distance en mètres entre deux points GPS (formule de Haversine) */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Rayon de la Terre en mètres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/** Convertit un timestamp ISO en "HH:MM" */
function isoToHHMM(iso: string | null): string {
  if (!iso) return "19:00";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Détermine les flags d'une offre depuis son type */
function flagsForOfferType(type: string, originalPrice?: number | null, price?: number): OfferFlag[] {
  const flags: OfferFlag[] = [];
  if (type === "FLASH") flags.push("flash");
  if (type === "DERNIERE_MINUTE" || type === "PROMO") flags.push("hot");
  if (type === "ARRIVAGE" || type === "EXCLUSIVITE") flags.push("new");
  if (originalPrice && price != null && originalPrice > price && !flags.includes("hot") && type !== "FLASH") {
    flags.push("hot");
  }
  return flags;
}

/** Mappe un shop Supabase vers le type Merchant */
function mapShop(row: Record<string, unknown>): Merchant {
  const lat = (row.lat as number) || REF_LAT;
  const lng = (row.lng as number) || REF_LNG;
  const distanceM = haversineDistance(REF_LAT, REF_LNG, lat, lng);
  const openUntil = (row.open_until as string) || "19:00";
  const address = `${row.address || ""}, ${row.zip || ""} ${row.city || ""}`.trim();

  return {
    id: row.id as string,
    name: row.name as string,
    slug: (row.slug as string) || (row.name as string).toLowerCase().replace(/\s+/g, "-"),
    category: (row.category as CategoryId) || "all",
    city: (row.city as string) || "Villeneuve",
    address,
    phone: (row.phone as string) || "",
    hours: `Lun–Sam 08:00–${openUntil}`,
    hoursToday: `Ouvert jusqu'à ${openUntil}`,
    openUntil,
    openFrom: "08:00",
    rating: 4.5,
    reviewCount: 0,
    distanceM,
    lat,
    lng,
    x: Math.round(((lng - 6.92) / 0.02) * 100),
    y: Math.round(((46.40 - lat) / 0.01) * 100),
    cover: (row.image_url as string) || "/offers/a1/epicerie-da-silva.webp",
    banner: (row.image_url as string) || "/shops/epicerie-da-silva.jpg",
    about: (row.description as string) || "",
    sells: [],
    registryNumber: "",
    website: "",
    photos: [],
    color: (row.color as string) || "#666",
    isNew: false,
    reviews: [],
  };
}

/** Mappe une offre Supabase vers le type Offer */
function mapOffer(row: Record<string, unknown>): Offer {
  const type = (row.offer_type as string) || "PROMO";
  const image = (row.image_url as string) || "/offers/a1/epicerie-da-silva.webp";

  return {
    id: row.id as string,
    merchantId: row.shop_id as string,
    title: row.title as string,
    description: (row.description as string) || undefined,
    image,
    originalPrice: (row.original_price as number) || undefined,
    price: (row.price as number) || 0,
    stock: (row.quantity_left as number) ?? 0,
    until: isoToHHMM(row.ends_at as string | null),
    flags: flagsForOfferType(type, row.original_price as number | null, row.price as number),
    type: type as OfferType,
    unit: (row.unit as string) || "pièce",
  };
}

/** Charge tous les shops actifs depuis Supabase */
export async function fetchMerchants(): Promise<Merchant[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ec_shops")
    .select("*")
    .eq("active", true);
  if (error) {
    console.error("Erreur fetchMerchants:", error);
    return [];
  }
  return (data || []).map(mapShop);
}

/** Charge toutes les offres publiées depuis Supabase */
export async function fetchOffers(): Promise<Offer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ec_offers")
    .select("*")
    .eq("status", "PUBLIEE");
  if (error) {
    console.error("Erreur fetchOffers:", error);
    return [];
  }
  return (data || []).map(mapOffer);
}

/** Crée une réservation dans Supabase */
export async function createReservation(input: {
  offerId: string;
  shopId: string;
  quantity: number;
  clientName: string;
  clientPhone?: string;
}): Promise<{ id: string; pickup_code: string } | null> {
  if (!supabase) return null;
  const pickupCode = `EC-${Math.floor(1000 + Math.random() * 9000)}`;
  const { data, error } = await supabase
    .from("ec_reservations")
    .insert({
      offer_id: input.offerId,
      shop_id: input.shopId,
      quantity: input.quantity,
      status: "pending",
      pickup_code: pickupCode,
      client_name: input.clientName,
      client_phone: input.clientPhone || null,
    })
    .select("id, pickup_code")
    .single();
  if (error) {
    console.error("Erreur createReservation:", error);
    return null;
  }
  return { id: data.id, pickup_code: data.pickup_code };
}

/** Décrémente le stock d'une offre dans Supabase */
export async function decrementStock(offerId: string, qty: number): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.rpc("decrement_offer_stock", {
    offer_id: offerId,
    qty,
  });
  if (error) {
    console.error("Erreur decrementStock:", error);
    return false;
  }
  return true;
}

/** Ajoute/retire un favori dans Supabase */
export async function toggleFavorite(shopId: string, clientId: string, isFavorite: boolean): Promise<boolean> {
  if (!supabase) return false;
  if (isFavorite) {
    const { error } = await supabase
      .from("ec_favorites")
      .upsert({ client_id: clientId, shop_id: shopId });
    return !error;
  } else {
    const { error } = await supabase
      .from("ec_favorites")
      .delete()
      .eq("client_id", clientId)
      .eq("shop_id", shopId);
    return !error;
  }
}
