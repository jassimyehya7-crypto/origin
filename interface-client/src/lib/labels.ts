import type {
  CategoryId,
  OfferType,
  ReservationStatus,
} from "./types";

export const CATEGORY_LABELS: Record<Exclude<CategoryId, "all">, string> = {
  epicerie: "Épicerie",
  boulangerie: "Boulangerie",
  kiosque: "Kiosque",
  cremiere: "Fromagerie",
  boucherie: "Boucherie",
  coiffure: "Coiffure",
  laverie: "Laverie",
  rotisserie: "Rôtisserie",
  espace_game: "Espace game",
  restaurant: "Restaurant",
  agence_location: "Agence de location",
  agence_voyage: "Agence de voyage",
  autre: "Autre local",
};

export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  FLASH: "Offre du jour",
  PROMO: "Réduction",
  ARRIVAGE: "Nouveauté",
  EXCLUSIVITE: "Exclu",
  DERNIERE_MINUTE: "Dernière chance",
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  picked: "Récupérée",
  cancelled: "Annulée",
  refused: "Refusée",
};

export const PRICING_NOTE =
  "1er mois offert, puis CHF 49.90/mois. Téléphone gratuit · Tablette installée en option payante.";

export const PRO_SHOP_ID = "shop_dasilva";
export const PRO_SHOP_NAME = "Épicerie Da Silva";
