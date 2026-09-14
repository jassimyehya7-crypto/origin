import type {
  DevicePlan,
  Favorite,
  Offer,
  OfferStatus,
  OfferType,
  PresenceClient,
  QrScan,
  Reservation,
  ReservationStatus,
  Shop,
  ShopCategory,
} from "@/lib/types";

export type EcShopRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  address: string;
  city: string;
  zip: string | null;
  lat: number;
  lng: number;
  open_until: string;
  phone: string | null;
  description: string | null;
  active: boolean;
  device_plan: string | null;
  trial_ends_at: string | null;
  emoji: string | null;
  color: string | null;
};

export type EcOfferRow = {
  id: string;
  shop_id: string;
  title: string;
  description: string | null;
  offer_type: string;
  price: number | string;
  original_price: number | string | null;
  quantity_total: number;
  quantity_left: number;
  status: string;
  ends_at: string;
  published_at: string | null;
  views: number;
  image_emoji: string | null;
  unit: string | null;
  created_at: string;
};

export type EcReservationRow = {
  id: string;
  offer_id: string;
  shop_id: string;
  quantity: number;
  status: string;
  pickup_code: string;
  client_name: string | null;
  client_phone: string | null;
  soft_user_id: string | null;
  client_message: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  picked_up_at: string | null;
};

export type EcScanRow = {
  id: string;
  shop_id: string;
  shop_slug: string;
  session_id: string | null;
  browsed: boolean;
  reserved: boolean;
  picked_up: boolean;
  browsed_no_reserve: boolean;
  created_at: string;
};

export type EcPresenceRow = {
  client_id: string;
  last_seen: string;
  page: string | null;
};

export type EcFavoriteRow = {
  client_id: string;
  shop_id: string;
  created_at: string;
};

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

export function rowToShop(r: EcShopRow): Shop {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    category: r.category as ShopCategory,
    address: r.address,
    phone: r.phone || "",
    city: r.city,
    zip: r.zip || "1844",
    lat: r.lat,
    lng: r.lng,
    description: r.description || "",
    openUntil: r.open_until,
    published: r.active,
    devicePlan: (r.device_plan as DevicePlan) || "telephone",
    trialEndsAt: r.trial_ends_at || new Date().toISOString(),
    emoji: r.emoji || "",
    color: r.color || "#2E7D32",
  };
}

export function shopToRow(s: Shop): Record<string, unknown> {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    category: s.category,
    address: s.address,
    city: s.city,
    zip: s.zip,
    lat: s.lat,
    lng: s.lng,
    open_until: s.openUntil,
    phone: s.phone,
    description: s.description,
    active: s.published,
    device_plan: s.devicePlan,
    trial_ends_at: s.trialEndsAt,
    emoji: s.emoji,
    color: s.color,
    updated_at: new Date().toISOString(),
  };
}

export function rowToOffer(r: EcOfferRow): Offer {
  return {
    id: r.id,
    shopId: r.shop_id,
    title: r.title,
    description: r.description || "",
    type: r.offer_type as OfferType,
    status: r.status as OfferStatus,
    price: num(r.price),
    originalPrice:
      r.original_price == null ? undefined : num(r.original_price),
    quantityTotal: r.quantity_total,
    quantityLeft: r.quantity_left,
    unit: r.unit || "lot",
    emoji: r.image_emoji || "",
    validUntil: r.ends_at,
    createdAt: r.created_at,
    publishedAt: r.published_at || undefined,
    views: r.views ?? 0,
  };
}

export function offerToRow(o: Offer): Record<string, unknown> {
  return {
    id: o.id,
    shop_id: o.shopId,
    title: o.title,
    description: o.description,
    offer_type: o.type,
    price: o.price,
    original_price: o.originalPrice ?? null,
    quantity_total: o.quantityTotal,
    quantity_left: o.quantityLeft,
    status: o.status,
    ends_at: o.validUntil,
    published_at: o.publishedAt ?? null,
    views: o.views,
    image_emoji: o.emoji,
    unit: o.unit,
    updated_at: new Date().toISOString(),
  };
}

export function rowToReservation(r: EcReservationRow): Reservation {
  return {
    id: r.id,
    offerId: r.offer_id,
    shopId: r.shop_id,
    clientName: r.client_name || "Client",
    clientPhone: r.client_phone || "",
    softUserId: r.soft_user_id || undefined,
    quantity: r.quantity,
    status: r.status as ReservationStatus,
    code: r.pickup_code,
    message: r.client_message || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    confirmedAt: r.confirmed_at || undefined,
    pickedUpAt: r.picked_up_at || undefined,
  };
}

export function reservationToRow(r: Reservation): Record<string, unknown> {
  return {
    id: r.id,
    offer_id: r.offerId,
    shop_id: r.shopId,
    quantity: r.quantity,
    status: r.status,
    pickup_code: r.code,
    client_name: r.clientName,
    client_phone: r.clientPhone,
    soft_user_id: r.softUserId ?? null,
    client_message: r.message ?? null,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    confirmed_at: r.confirmedAt ?? null,
    picked_up_at: r.pickedUpAt ?? null,
  };
}

export function rowToScan(r: EcScanRow): QrScan {
  return {
    id: r.id,
    shopId: r.shop_id,
    shopSlug: r.shop_slug,
    scannedAt: r.created_at,
    sessionId: r.session_id || r.id,
    browsed: r.browsed,
    reserved: r.reserved,
    pickedUp: r.picked_up,
  };
}

export function scanToRow(s: QrScan): Record<string, unknown> {
  return {
    id: s.id,
    shop_id: s.shopId,
    shop_slug: s.shopSlug,
    session_id: s.sessionId,
    browsed: s.browsed,
    reserved: s.reserved,
    picked_up: s.pickedUp,
    browsed_no_reserve: s.browsed && !s.reserved,
    created_at: s.scannedAt,
  };
}

export function rowToPresence(r: EcPresenceRow): PresenceClient {
  return {
    sessionId: r.client_id,
    lastSeen: r.last_seen,
    page: r.page || "/",
  };
}

export function rowToFavorite(r: EcFavoriteRow): Favorite {
  return { shopId: r.shop_id, addedAt: r.created_at };
}
