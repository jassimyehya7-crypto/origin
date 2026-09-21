export type CategoryId =
  | "all"
  | "epicerie"
  | "boulangerie"
  | "kiosque"
  | "cremiere"
  | "boucherie"
  | "coiffure"
  | "laverie"
  | "rotisserie"
  | "espace_game"
  | "restaurant"
  | "agence_location"
  | "agence_voyage"
  | "autre";

export type InterestId = Exclude<CategoryId, "all">;

export type LocationId =
  | "villeneuve"
  | "vevey"
  | "tour-de-peilz"
  | "montreux"
  | "lausanne";

export type OfferFlag = "hot" | "new" | "flash";

export type OfferType =
  | "FLASH"
  | "PROMO"
  | "ARRIVAGE"
  | "EXCLUSIVITE"
  | "DERNIERE_MINUTE";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "picked"
  | "cancelled"
  | "refused";

export type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
};

export type Merchant = {
  id: string;
  name: string;
  slug: string;
  category: CategoryId;
  city: string;
  address: string;
  phone: string;
  hours: string;
  hoursToday: string;
  openUntil: string;
  openFrom: string;
  rating: number;
  reviewCount: number;
  distanceM: number;
  lat: number;
  lng: number;
  x: number;
  y: number;
  cover: string;
  banner: string;
  about: string;
  sells: string[];
  registryNumber: string;
  website: string;
  photos: string[];
  color: string;
  isNew?: boolean;
  reviews: Review[];
};

export type Offer = {
  id: string;
  merchantId: string;
  title: string;
  description?: string;
  image: string;
  originalPrice?: number;
  price: number;
  stock: number;
  until: string;
  flags: OfferFlag[];
  type: OfferType;
  unit: string;
};

export type Reservation = {
  id: string;
  offerId: string;
  merchantId: string;
  title: string;
  merchantName: string;
  image: string;
  qty: number;
  unitPrice: number;
  originalPrice?: number;
  until: string;
  distanceM: number;
  address: string;
  createdAt: string;
  status: ReservationStatus;
  code: string;
  mine?: boolean;
  clientName?: string;
  unit?: string;
};

export type NotifPrefs = {
  nearby: boolean;
  favorites: boolean;
  flash: boolean;
  weekly: boolean;
};
