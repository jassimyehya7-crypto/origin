import type {
  OfferStatus,
  OfferType,
  ReservationStatus,
  ShopCategory,
} from "./types";

export const CATEGORY_LABELS: Record<ShopCategory, string> = {
  epicerie: "Épicerie",
  boulangerie: "Boulangerie",
  kiosque: "Kiosque",
  cremiere: "Crémière",
  autre: "Autre local",
};

export const CATEGORY_ICONS: Record<ShopCategory, string> = {
  epicerie: "🛒",
  boulangerie: "🥖",
  kiosque: "📰",
  cremiere: "🧀",
  autre: "🏪",
};

export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  FLASH: "Flash",
  PROMO: "Promo",
  ARRIVAGE: "Arrivage",
  DERNIERE_MINUTE: "Dernière minute",
};

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  BROUILLON: "Brouillon",
  PUBLIEE: "Publiée",
  EPUISEE: "Épuisée",
  EXPIREE: "Expirée",
  SUSPENDUE: "Suspendue",
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  EN_ATTENTE: "En attente",
  CONFIRMEE: "Confirmée",
  RECUPEREE: "Récupérée",
  REFUSEE: "Refusée",
  ANNULEE: "Annulée",
  NON_RECUPEREE: "Non récupérée",
  EXPIREE: "Expirée",
};

export const PRICING_NOTE =
  "1er mois offert, puis CHF 49.90/mois. Téléphone gratuit · Tablette installée en option payante.";
