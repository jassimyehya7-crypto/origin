import type { Alert, AppState, Offer, Reservation, Shop } from "./types";
import { todayEndOfDayISO } from "./utils";

const ZONE = { city: "Villeneuve", zip: "1844" };
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export function createA1Shops(): Shop[] {
  const trial = new Date();
  trial.setDate(trial.getDate() + 25);
  const common = {
    ...ZONE,
    published: true,
    devicePlan: "telephone" as const,
    subscriptionActive: false,
    tabletRequestStatus: "none" as const,
    trialEndsAt: trial.toISOString(),
    emoji: "",
  };
  return [
    { id: "shop_dasilva", name: "Épicerie Da Silva", slug: "epicerie-da-silva", category: "epicerie", address: "Rue des Narcisses 3", phone: "021 960 36 28", lat: 46.3972, lng: 6.9265, description: "Épicerie de quartier et produits du quotidien.", openUntil: "19:00", color: "#2E7D32", ...common },
    { id: "shop_durgnat", name: "Boulangerie Durgnat", slug: "boulangerie-durgnat", category: "boulangerie", address: "Grand-Rue 61", phone: "021 960 10 76", lat: 46.3967, lng: 6.9256, description: "Boulangerie, pâtisserie et confiserie.", openUntil: "18:30", color: "#D4A017", ...common },
    { id: "shop_macheret", name: "Macheret Fromage", slug: "macheret-fromage", category: "cremiere", address: "Grand-Rue 21", phone: "021 960 13 75", lat: 46.3975, lng: 6.9248, description: "Fromagerie et spécialités locales.", openUntil: "18:00", color: "#F9A825", ...common },
    { id: "shop_fontaine", name: "Boucherie de la Fontaine", slug: "boucherie-fontaine", category: "boucherie", address: "Rue des Remparts 2", phone: "021 960 15 57", lat: 46.3979, lng: 6.9262, description: "Boucherie artisanale de Villeneuve.", openUntil: "18:00", color: "#C62828", ...common },
    { id: "shop_2freres", name: "Boucherie Les 2 Frères", slug: "boucherie-les-2-freres", category: "boucherie", address: "Grand-Rue 24", phone: "021 960 10 64", lat: 46.3973, lng: 6.9246, description: "Boucherie-charcuterie au centre de Villeneuve.", openUntil: "18:00", color: "#8D3A32", ...common },
    { id: "shop_poulet", name: "Le Poulet d’Enfer", slug: "poulet-enfer", category: "rotisserie", address: "Route des Paquays", phone: "079 381 25 55", lat: 46.3948, lng: 6.9292, description: "Poulets rôtis et restauration à emporter.", openUntil: "19:00", color: "#E65100", ...common },
    { id: "shop_kiosque", name: "Kiosque de la Gare", slug: "kiosque-gare", category: "kiosque", address: "Place de la Gare 1", phone: "021 960 44 11", lat: 46.3958, lng: 6.9272, description: "Presse, snacks et boissons près des quais.", openUntil: "20:00", color: "#00897B", ...common },
    { id: "shop_kiosque_leman", name: "Kiosque du Léman", slug: "kiosque-du-leman", category: "kiosque", address: "Grand-Rue 46", phone: "021 960 11 64", lat: 46.3969, lng: 6.9252, description: "Kiosque et produits pratiques du quotidien.", openUntil: "19:00", color: "#00796B", ...common },
    { id: "shop_house", name: "The House Fortuné", slug: "the-house-fortune", category: "coiffure", address: "Grand-Rue 18", phone: "077 946 96 13", lat: 46.3975, lng: 6.9245, description: "Salon de coiffure à Villeneuve.", openUntil: "18:30", color: "#6D4C41", ...common },
    { id: "shop_byhani", name: "By Hani", slug: "by-hani", category: "coiffure", address: "Grand-Rue 66", phone: "079 924 74 19", lat: 46.3965, lng: 6.9259, description: "Salon de coiffure et beauté.", openUntil: "18:30", color: "#AD1457", ...common },
    { id: "shop_elegance", name: "Élégance Barber Shop", slug: "elegance-barber-shop", category: "coiffure", address: "Grand-Rue 17", phone: "021 968 12 31", lat: 46.3976, lng: 6.9247, description: "Barber shop au centre de Villeneuve.", openUntil: "19:00", color: "#37474F", ...common },
    { id: "shop_soslessive", name: "SOSLESSIVE Riviera", slug: "soslessive-riviera", category: "laverie", address: "Grand-Rue 2", phone: "079 799 09 89", lat: 46.3980, lng: 6.9241, description: "Laverie et service de lessive à Villeneuve.", openUntil: "18:30", color: "#1565C0", ...common },
  ] as Shop[];
}

export function createA1Offers(shops: Shop[]): Offer[] {
  const end = (shopId: string) => todayEndOfDayISO(shops.find((s) => s.id === shopId)!.openUntil);
  const items: Array<Omit<Offer, "validUntil" | "createdAt" | "publishedAt" | "views" | "status" | "emoji"> & { age: number }> = [
    { id: "a1_dasilva_panier", shopId: "shop_dasilva", title: "Panier fruits du jour", description: "Un assortiment de fruits mûrs à récupérer aujourd’hui.", type: "PROMO", price: 6.9, originalPrice: 10.5, quantityTotal: 10, quantityLeft: 8, unit: "panier", imageUrl: "/offers/a1/epicerie-da-silva.webp", age: 1 },
    { id: "a1_durgnat_viennoiseries", shopId: "shop_durgnat", title: "4 viennoiseries du jour", description: "Croissants et pains au chocolat préparés aujourd’hui.", type: "DERNIERE_MINUTE", price: 5.9, originalPrice: 9.2, quantityTotal: 12, quantityLeft: 7, unit: "lot", imageUrl: "/offers/a1/boulangerie-durgnat.webp", age: 2 },
    { id: "a1_macheret_plateau", shopId: "shop_macheret", title: "Plateau découverte vaudois", description: "Sélection de trois fromages pour un apéritif local.", type: "EXCLUSIVITE", price: 14.9, originalPrice: 19.5, quantityTotal: 6, quantityLeft: 4, unit: "plateau", imageUrl: "/offers/a1/macheret-fromage.webp", age: 3 },
    { id: "a1_fontaine_grillades", shopId: "shop_fontaine", title: "Assortiment grillades", description: "Sélection du boucher prête à cuire, disponible aujourd’hui.", type: "PROMO", price: 18.9, originalPrice: 24.9, quantityTotal: 8, quantityLeft: 5, unit: "lot", imageUrl: "/offers/a1/boucherie-fontaine.webp", age: 1.5 },
    { id: "a1_2freres_saucisses", shopId: "shop_2freres", title: "Saucisses artisanales", description: "Lot de saucisses fraîches préparées par la boucherie.", type: "ARRIVAGE", price: 11.9, quantityTotal: 10, quantityLeft: 6, unit: "lot", imageUrl: "/offers/a1/boucherie-2-freres.webp", age: 4 },
    { id: "a1_poulet_menu", shopId: "shop_poulet", title: "Menu poulet rôti", description: "Demi-poulet rôti avec accompagnement, à emporter.", type: "FLASH", price: 13.9, originalPrice: 17.5, quantityTotal: 10, quantityLeft: 6, unit: "menu", imageUrl: "/offers/a1/poulet-enfer.webp", age: 2.5 },
    { id: "a1_kiosque_combo", shopId: "shop_kiosque", title: "Combo pause express", description: "Chips, canette et chewing-gum pour la route.", type: "FLASH", price: 5.9, originalPrice: 8.1, quantityTotal: 0, quantityLeft: 0, durationHours: 3, unit: "combo", imageUrl: "/offers/a1/kiosque-gare.webp", age: 0.75 },
    { id: "a1_leman_combo", shopId: "shop_kiosque_leman", title: "Pause fraîcheur", description: "Boisson fraîche et snack salé à prix réduit.", type: "PROMO", price: 4.9, originalPrice: 6.8, quantityTotal: 12, quantityLeft: 9, unit: "combo", imageUrl: "/offers/a1/kiosque-leman.webp", age: 3.5 },
    { id: "a1_house_coupe", shopId: "shop_house", title: "Créneau coupe cette semaine", description: "Un créneau découverte disponible sur réservation.", type: "EXCLUSIVITE", price: 29, originalPrice: 39, quantityTotal: 4, quantityLeft: 3, unit: "créneau", imageUrl: "/offers/a1/the-house-fortune.webp", age: 5 },
    { id: "a1_byhani_soin", shopId: "shop_byhani", title: "Soin + brushing", description: "Formule découverte proposée cette semaine.", type: "PROMO", price: 39, originalPrice: 55, quantityTotal: 5, quantityLeft: 4, unit: "créneau", imageUrl: "/offers/a1/by-hani.webp", age: 4.5 },
    { id: "a1_elegance_barber", shopId: "shop_elegance", title: "Coupe homme découverte", description: "Quelques créneaux à tarif découverte cette semaine.", type: "FLASH", price: 24, originalPrice: 32, quantityTotal: 5, quantityLeft: 3, unit: "créneau", imageUrl: "/offers/a1/elegance-barber.webp", age: 6 },
    { id: "a1_lessive_couette", shopId: "shop_soslessive", title: "Nettoyage couette", description: "Offre du mois pour une couette standard.", type: "PROMO", price: 19.9, originalPrice: 26, quantityTotal: 8, quantityLeft: 6, unit: "pièce", imageUrl: "/offers/a1/sos-lessive.webp", age: 7 },
  ];
  return items.map(({ age, ...offer }) => ({ ...offer, status: "PUBLIEE", emoji: "", validUntil: offer.durationHours ? new Date(Date.now() + (offer.durationHours - age) * 3_600_000).toISOString() : end(offer.shopId), createdAt: hoursAgo(age), publishedAt: hoursAgo(age), views: Math.round(24 + age * 11) }));
}

export function createA1InitialState(): AppState {
  const shops = createA1Shops();
  const offers = createA1Offers(shops);
  const reservations: Reservation[] = [
    { id: "a1_resa_1", offerId: "a1_dasilva_panier", shopId: "shop_dasilva", clientName: "Marie", clientPhone: "079 123 45 67", quantity: 1, status: "EN_ATTENTE", code: "EC-4821", createdAt: minutesAgo(12), updatedAt: minutesAgo(12) },
    { id: "a1_resa_2", offerId: "a1_durgnat_viennoiseries", shopId: "shop_durgnat", clientName: "Nico", clientPhone: "078 987 65 43", quantity: 1, status: "CONFIRMEE", code: "EC-3104", createdAt: hoursAgo(1.5), updatedAt: hoursAgo(1.2), confirmedAt: hoursAgo(1.2) },
  ];
  const alerts: Alert[] = [{ id: "a1_alert", type: "info", title: "Catalogue prototype A1", message: "12 commerces locaux sont prêts pour la démonstration.", createdAt: minutesAgo(5) }];
  return { shops, offers, reservations, favorites: [], scans: [], presence: [], client: { id: "client_demo", name: "", phone: "" }, alerts, seededAt: new Date().toISOString() };
}
