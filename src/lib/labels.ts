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

/** Non-emoji category marks (initials) for chips / lists. */
export const CATEGORY_ICONS: Record<ShopCategory, string> = {
  epicerie: "É",
  boulangerie: "B",
  kiosque: "K",
  cremiere: "F",
  boucherie: "B",
  coiffure: "C",
  laverie: "L",
  rotisserie: "R",
  espace_game: "G",
  restaurant: "R",
  agence_location: "L",
  agence_voyage: "V",
  autre: "A",
};

/** Visible French retail labels — DB enum values stay FLASH/PROMO/… */
export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  FLASH: "Offre du jour",
  PROMO: "Réduction",
  ARRIVAGE: "Nouveauté",
  EXCLUSIVITE: "Exclu",
  DERNIERE_MINUTE: "Dernière chance",
};

export const OFFER_TYPE_DESCRIPTIONS: Record<OfferType, string> = {
  FLASH: "Un deal éphémère, valable aujourd'hui uniquement",
  PROMO: "Prix réduit sur un produit existant",
  ARRIVAGE: "Nouveau produit qui vient d'arriver",
  EXCLUSIVITE: "Disponible uniquement chez vous, introuvable ailleurs",
  DERNIERE_MINUTE: "Dernières unités avant fermeture ou péremption",
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
  NON_RECUPEREE: "Pas venu",
  EXPIREE: "Non retirée",
};

export const PRICING_NOTE =
  "1er mois offert, puis CHF 49.90/mois. Téléphone gratuit · Tablette installée en option payante.";

/** Pro merchant copy (no jargon). */
export const PRO_COPY = {
  tabToday: "Aujourd'hui",
  tabOffers: "Offres",
  tabShop: "Magasin",
  sectionPending: "À confirmer",
  sectionPickup: "À préparer",
  emptyAll: "Rien à traiter pour le moment",
  emptyPending: "Aucune demande en attente",
  emptyPickup: "Aucune réservation à préparer",
  dayEnded: "Journée terminée · reprise demain",
  endsAt: (hm: string) => `Ouvert jusqu'à ${hm.replace(":", "h")}`,
  autoClose: (hm: string) =>
    `Fermeture PME à ${hm}. Les offres en cours se mettent en pause et reprennent le lendemain.`,
} as const;
