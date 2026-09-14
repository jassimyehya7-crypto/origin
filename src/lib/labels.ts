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

/** Non-emoji category marks (initials) for chips / lists. */
export const CATEGORY_ICONS: Record<ShopCategory, string> = {
  epicerie: "É",
  boulangerie: "B",
  kiosque: "K",
  cremiere: "C",
  autre: "A",
};

/** Visible French retail labels — DB enum values stay FLASH/PROMO/… */
export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  FLASH: "OFFRES",
  PROMO: "Promo en réduction",
  ARRIVAGE: "Nouveautés",
  DERNIERE_MINUTE: "Dernière chance",
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

/** Pro merchant copy (no jargon). */
export const PRO_COPY = {
  tabToday: "Aujourd'hui",
  tabOffers: "Offres",
  tabShop: "Magasin",
  sectionPending: "À confirmer",
  sectionPickup: "À retirer",
  emptyAll: "Rien à traiter",
  emptyPending: "Rien à confirmer",
  emptyPickup: "Rien à retirer",
  dayEnded: "Journée terminée · reprise demain",
  endsAt: (hm: string) => `Se termine à ${hm}`,
  autoClose: (hm: string) =>
    `Fin de journée automatique à ${hm}. À cette heure, les réservations non retirées passent en terminées et le stock revient.`,
} as const;
