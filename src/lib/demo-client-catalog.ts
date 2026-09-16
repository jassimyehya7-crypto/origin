import type { Offer, Shop } from "@/lib/types";

const future = () => new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString();
const now = () => new Date().toISOString();
const trial = () => new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString();

export const DEMO_CLIENT_SHOPS: Shop[] = [
  { id: "demo_riviera", slug: "epicerie-la-riviera", name: "Épicerie La Riviera", category: "epicerie", address: "Rue du Lac 12", city: "Villeneuve", zip: "1844", lat: 46.3972, lng: 6.9265, openUntil: "19:00", phone: "021 960 20 20", description: "Épicerie de quartier et produits frais.", published: true, devicePlan: "telephone", trialEndsAt: trial(), emoji: "", color: "#2E7D32", subscriptionActive: true, tabletRequestStatus: "none" },
  { id: "demo_marche", slug: "boulangerie-du-marche", name: "Boulangerie du Marché", category: "boulangerie", address: "Grand-Rue 38", city: "Villeneuve", zip: "1844", lat: 46.3967, lng: 6.9256, openUntil: "18:30", phone: "021 960 18 18", description: "Pains artisanaux et viennoiseries du jour.", published: true, devicePlan: "telephone", trialEndsAt: trial(), emoji: "", color: "#D4A017", subscriptionActive: true, tabletRequestStatus: "none" },
  { id: "demo_brushing", slug: "coupe-et-brushing", name: "Coupe & brushing", category: "coiffure", address: "Rue de la Gare 6", city: "Villeneuve", zip: "1844", lat: 46.3975, lng: 6.9248, openUntil: "18:30", phone: "021 960 33 33", description: "Salon de coiffure pour femmes et hommes.", published: true, devicePlan: "telephone", trialEndsAt: trial(), emoji: "", color: "#6D4C41", subscriptionActive: true, tabletRequestStatus: "none" },
  { id: "demo_kiosk", slug: "k-kiosk-villeneuve", name: "k kiosk", category: "kiosque", address: "Place de la Gare 1", city: "Villeneuve", zip: "1844", lat: 46.3958, lng: 6.9272, openUntil: "20:00", phone: "021 960 44 11", description: "Presse, snacks et boissons près des quais.", published: true, devicePlan: "telephone", trialEndsAt: trial(), emoji: "", color: "#D71920", subscriptionActive: true, tabletRequestStatus: "none" },
  { id: "demo_fromage", slug: "fromagerie-du-leman", name: "Fromagerie du Léman", category: "cremiere", address: "Grand-Rue 21", city: "Villeneuve", zip: "1844", lat: 46.3975, lng: 6.9247, openUntil: "18:00", phone: "021 960 13 75", description: "Fromages locaux et spécialités vaudoises.", published: true, devicePlan: "telephone", trialEndsAt: trial(), emoji: "", color: "#F9A825", subscriptionActive: true, tabletRequestStatus: "none" },
];

export function demoClientOffers(): Offer[] {
  const common = { status: "PUBLIEE" as const, type: "PROMO" as const, validUntil: future(), createdAt: now(), publishedAt: now(), views: 20, emoji: "" };
  return [
    { ...common, id: "demo_tomates", shopId: "demo_riviera", title: "Tomates suisses", description: "Tomates suisses fraîches, calibre La Riviera.", price: 2.9, originalPrice: 3.9, quantityTotal: 16, quantityLeft: 10, unit: "kg", imageUrl: "/offers/a1/epicerie-da-silva.webp" },
    { ...common, id: "demo_pain", shopId: "demo_marche", title: "Pain de campagne", description: "Pain de campagne artisanal cuit aujourd’hui.", price: 2.9, originalPrice: 4.2, quantityTotal: 8, quantityLeft: 6, unit: "pièce", imageUrl: "/offers/a1/boulangerie-durgnat.webp" },
    { ...common, id: "demo_brush", shopId: "demo_brushing", title: "Coupe & brushing", description: "Créneau coupe et brushing à tarif découverte.", price: 48, originalPrice: 60, quantityTotal: 3, quantityLeft: 3, unit: "créneau", imageUrl: "/offers/a1/elegance-barber.webp" },
    { ...common, id: "demo_snacks", shopId: "demo_kiosk", title: "Sélection de magazines", description: "Une sélection de magazines et snacks à prix club.", price: 4.2, originalPrice: 4.95, quantityTotal: 5, quantityLeft: 5, unit: "lot", imageUrl: "/offers/a1/kiosque-gare.webp" },
    { ...common, id: "demo_tomme", shopId: "demo_fromage", title: "Tomme vaudoise", description: "Tomme vaudoise locale, affinée et prête à déguster.", price: 7.9, originalPrice: 9.9, quantityTotal: 7, quantityLeft: 7, unit: "pièce", imageUrl: "/offers/a1/macheret-fromage.webp" },
  ];
}
