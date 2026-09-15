export type ShopCategory =
  | "epicerie"
  | "boulangerie"
  | "kiosque"
  | "cremiere"
  | "boucherie"
  | "coiffure"
  | "laverie"
  | "rotisserie"
  | "autre";

export type OfferType =
  | "FLASH"
  | "PROMO"
  | "ARRIVAGE"
  | "EXCLUSIVITE"
  | "DERNIERE_MINUTE";

export type OfferStatus =
  | "BROUILLON"
  | "PUBLIEE"
  | "EPUISEE"
  | "EXPIREE"
  | "SUSPENDUE";

export type ReservationStatus =
  | "EN_ATTENTE"
  | "CONFIRMEE"
  | "RECUPEREE"
  | "REFUSEE"
  | "ANNULEE"
  | "NON_RECUPEREE"
  | "EXPIREE";

export type DevicePlan = "telephone" | "tablette";

export type TabletRequestStatus = "none" | "pending" | "approved" | "installed";

export interface Shop {
  id: string;
  name: string;
  slug: string;
  category: ShopCategory;
  address: string;
  phone: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  description: string;
  openUntil: string; // HH:mm
  published: boolean;
  devicePlan: DevicePlan;
  trialEndsAt: string;
  emoji: string;
  color: string;
  /** Founder-controlled; Pro cannot toggle. */
  subscriptionActive: boolean;
  tabletRequestStatus: TabletRequestStatus;
  tabletRequestedAt?: string;
}

export interface Offer {
  id: string;
  shopId: string;
  title: string;
  description: string;
  type: OfferType;
  status: OfferStatus;
  price: number;
  originalPrice?: number;
  quantityTotal: number;
  quantityLeft: number;
  unit: string;
  emoji: string;
  /** Public product photo URL (Storage). */
  imageUrl?: string;
  validUntil: string; // ISO date end of business day
  createdAt: string;
  publishedAt?: string;
  views: number;
}

export interface Reservation {
  id: string;
  offerId: string;
  shopId: string;
  clientName: string;
  clientPhone: string;
  softUserId?: string;
  quantity: number;
  status: ReservationStatus;
  code: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  pickedUpAt?: string;
}

export interface Favorite {
  shopId: string;
  addedAt: string;
}

export interface QrScan {
  id: string;
  shopId: string;
  shopSlug: string;
  scannedAt: string;
  sessionId: string;
  browsed: boolean;
  reserved: boolean;
  pickedUp: boolean;
}

export interface PresenceClient {
  sessionId: string;
  lastSeen: string;
  page: string;
}

export interface DemoClient {
  id: string;
  name: string;
  phone: string;
}


export type FounderMessageStatus = "nouveau" | "lu" | "traite";

export interface FounderMessage {
  id: string;
  shopId: string;
  shopName?: string;
  body?: string;
  audioUrl?: string;
  status: FounderMessageStatus;
  createdAt: string;
}

export interface AppState {
  shops: Shop[];
  offers: Offer[];
  reservations: Reservation[];
  favorites: Favorite[];
  scans: QrScan[];
  presence: PresenceClient[];
  client: DemoClient;
  alerts: Alert[];
  seededAt: string;
}

export interface Alert {
  id: string;
  type: "info" | "warning" | "success";
  title: string;
  message: string;
  createdAt: string;
  shopId?: string;
}
