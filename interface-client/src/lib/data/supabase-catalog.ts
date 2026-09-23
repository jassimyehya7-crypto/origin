import { supabase } from "@/lib/supabase";
import type { Merchant, Offer, OfferFlag, OfferType, CategoryId, Reservation, ReservationStatus } from "@/lib/types";

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

function mapReservationStatus(status: unknown): ReservationStatus {
  switch (String(status || "").toUpperCase()) {
    case "EN_ATTENTE": return "pending";
    case "CONFIRMEE": return "confirmed";
    case "RECUPEREE": return "picked";
    case "REFUSEE": return "refused";
    case "ANNULEE": return "cancelled";
    case "NON_RECUPEREE":
    case "EXPIREE": return "cancelled";
    default: return "pending";
  }
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
    availabilityMode: row.availability_mode === "duration" ? "duration" : "lots",
    durationMinutes: row.duration_minutes == null ? undefined : Number(row.duration_minutes),
    createdAt: (row.created_at as string) || undefined,
    endsAt: (row.ends_at as string) || undefined,
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
    throw error;
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
    throw error;
  }
  return (data || []).map(mapOffer);
}

/** Charge les réservations partagées pour la synchronisation client/commerçant. */
function mapReservation(row: Record<string, unknown>): Reservation {
    const offer = (row.ec_offers || {}) as Record<string, unknown>;
    const shop = (row.ec_shops || {}) as Record<string, unknown>;
    return {
      id: row.id as string,
      requestId: row.request_id as string | undefined,
      offerId: row.offer_id as string,
      merchantId: row.shop_id as string,
      title: (offer.title as string) || "Offre",
      merchantName: (shop.name as string) || "Commerce",
      image: (offer.image_url as string) || "/offers/a1/epicerie-da-silva.webp",
      qty: Number(row.quantity) || 1,
      unitPrice: Number(offer.price) || 0,
      originalPrice: offer.original_price == null ? undefined : Number(offer.original_price),
      until: isoToHHMM(offer.ends_at as string | null),
      distanceM: 0,
      address: [shop.address, shop.city].filter(Boolean).join(", "),
      createdAt: (row.created_at as string) || new Date().toISOString(),
      status: mapReservationStatus(row.status),
      code: (row.pickup_code as string) || "",
      clientName: (row.client_name as string) || "Client",
      unit: (offer.unit as string) || "lot",
      mine: false,
    };
}

/** Un client ne lit que les réservations dont il garde la clé de requête. */
export async function fetchClientReservations(requestIds: string[]): Promise<Reservation[]> {
  if (!supabase || requestIds.length === 0) return [];
  const client = supabase;
  const results = await Promise.all(requestIds.map(async (requestId) => {
    const { data, error } = await client.rpc("client_reservation_by_request", { p_request_id: requestId });
    if (error) throw error;
    return data ? mapReservation(data as Record<string, unknown>) : null;
  }));
  return results.filter((reservation): reservation is Reservation => reservation !== null);
}

export async function fetchMerchantReservations(): Promise<Reservation[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("merchant_reservations");
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map((row) => mapReservation(row as Record<string, unknown>));
}

export async function cancelClientReservation(requestId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("cancel_client_reservation", { p_request_id: requestId });
  if (error) throw error;
  return data === true;
}

export async function merchantCreateOffer(input: {
  shopId: string;
  title: string;
  image?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  type: OfferType;
  unit: string;
  availabilityMode: "lots" | "duration";
  durationMinutes?: number;
}): Promise<string | null> {
  if (!supabase) return null;
  let imageUrl: string | null = null;
  if (input.image) {
    if (input.image.startsWith("data:image/")) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Connexion commerçant requise");
      const imageBlob = await (await fetch(input.image)).blob();
      const extension = imageBlob.type === "image/png" ? "png" : imageBlob.type === "image/jpeg" ? "jpg" : "webp";
      const path = `${input.shopId}/${userData.user.id}/${crypto.randomUUID()}.${extension}`;
      const uploaded = await supabase.storage.from("offer-photos").upload(path, imageBlob, {
        contentType: imageBlob.type,
        cacheControl: "3600",
      });
      if (uploaded.error) throw uploaded.error;
      imageUrl = supabase.storage.from("offer-photos").getPublicUrl(path).data.publicUrl;
    } else {
      imageUrl = input.image;
    }
  }
  const { data, error } = await supabase.rpc("merchant_create_offer", {
    p_payload: {
      shop_id: input.shopId,
      title: input.title,
      image_url: imageUrl,
      price: input.price,
      original_price: input.originalPrice ?? null,
      stock: input.stock,
      offer_type: input.type,
      unit: input.unit,
      availability_mode: input.availabilityMode,
      duration_minutes: input.durationMinutes ?? null,
    },
  });
  if (error) throw error;
  return typeof data === "string" ? data : null;
}

export async function merchantHideOffer(offerId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("merchant_hide_offer", { p_offer_id: offerId });
  if (error) throw error;
  return data === true;
}

/** Réserve et décrémente le stock dans une seule transaction SQL. */
export async function reserveOfferAtomic(input: {
  offerId: string;
  shopId: string;
  quantity: number;
  clientName: string;
  clientPhone?: string;
  requestId: string;
}): Promise<{ id: string; pickupCode: string; remainingStock: number } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .rpc("reserve_offer_atomic", {
      p_offer_id: input.offerId,
      p_quantity: input.quantity,
      p_client_name: input.clientName,
      p_client_phone: input.clientPhone || null,
      p_request_id: input.requestId,
    });
  if (error) {
    console.error("Erreur reserveOfferAtomic:", error);
    return null;
  }
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.success) return null;
  return {
    id: result.reservation_id as string,
    pickupCode: result.pickup_code as string,
    remainingStock: result.remaining_stock as number,
  };
}

export async function transitionReservationAtomic(
  reservationId: string,
  status: ReservationStatus,
  pickupCode?: string,
): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("transition_reservation_atomic", {
    p_reservation_id: reservationId,
    p_new_status: status,
    p_pickup_code: pickupCode || null,
  });
  if (error) {
    console.error("Erreur transitionReservationAtomic:", error);
    return false;
  }
  return data === true;
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
