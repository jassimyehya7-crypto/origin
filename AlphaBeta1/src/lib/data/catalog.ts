import type {
  CategoryId,
  InterestId,
  LocationId,
  Merchant,
  Offer,
  OfferFlag,
  OfferType,
  Reservation,
} from "@/lib/types";

export const LOCATIONS: {
  id: LocationId;
  name: string;
  canton: string;
  extraM: number;
}[] = [
  { id: "villeneuve", name: "Villeneuve", canton: "VD", extraM: 0 },
  { id: "vevey", name: "Vevey", canton: "VD", extraM: 1100 },
  { id: "tour-de-peilz", name: "La Tour-de-Peilz", canton: "VD", extraM: 700 },
  { id: "montreux", name: "Montreux", canton: "VD", extraM: 2800 },
  { id: "lausanne", name: "Lausanne", canton: "VD", extraM: 22000 },
];

export const RADIUS_KM = [1, 3, 5, 10, 25] as const;

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "epicerie", label: "Épicerie" },
  { id: "boulangerie", label: "Boulangerie" },
  { id: "kiosque", label: "Kiosque" },
  { id: "coiffure", label: "Coiffure" },
  { id: "cremiere", label: "Fromagerie" },
  { id: "boucherie", label: "Boucherie" },
  { id: "laverie", label: "Laverie" },
  { id: "rotisserie", label: "Rôtisserie" },
  { id: "restaurant", label: "Restaurant" },
  { id: "espace_game", label: "Espace game" },
  { id: "agence_location", label: "Agence de location" },
  { id: "agence_voyage", label: "Agence de voyage" },
];

export const VISIBLE_CATEGORY_IDS: CategoryId[] = [
  "all",
  "epicerie",
  "boulangerie",
  "kiosque",
  "coiffure",
];

export const INTERESTS: { id: InterestId; label: string }[] = [
  { id: "epicerie", label: "Épicerie" },
  { id: "boulangerie", label: "Boulangerie" },
  { id: "boucherie", label: "Boucherie" },
  { id: "cremiere", label: "Fromagerie" },
  { id: "rotisserie", label: "Rôtisserie" },
  { id: "kiosque", label: "Kiosque" },
  { id: "coiffure", label: "Coiffure" },
  { id: "laverie", label: "Laverie" },
];

export const EXPLORE_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "alimentation", label: "Alimentation" },
  { id: "epicerie", label: "Épicerie" },
  { id: "boulangerie", label: "Boulangerie" },
  { id: "boucherie", label: "Boucherie" },
  { id: "kiosque", label: "Kiosque" },
  { id: "coiffure", label: "Coiffure" },
  { id: "services", label: "Services" },
];

const FOOD: CategoryId[] = [
  "epicerie",
  "boulangerie",
  "kiosque",
  "cremiere",
  "boucherie",
  "rotisserie",
];

export function flagsForType(
  type: OfferType,
  originalPrice?: number,
  price?: number,
): OfferFlag[] {
  const flags: OfferFlag[] = [];
  if (type === "FLASH") flags.push("flash");
  if (type === "DERNIERE_MINUTE" || type === "PROMO") flags.push("hot");
  if (type === "ARRIVAGE" || type === "EXCLUSIVITE") flags.push("new");
  if (
    originalPrice &&
    price != null &&
    originalPrice > price &&
    !flags.includes("hot") &&
    type !== "FLASH"
  ) {
    flags.push("hot");
  }
  return flags;
}

function r(
  id: string,
  author: string,
  rating: number,
  text: string,
  date: string,
) {
  return { id, author, rating, text, date };
}

export const MERCHANTS: Merchant[] = [
  {
    id: "shop_dasilva",
    name: "Épicerie Da Silva",
    slug: "epicerie-da-silva",
    category: "epicerie",
    city: "Villeneuve",
    address: "Rue des Narcisses 3, 1844 Villeneuve",
    phone: "021 960 36 28",
    hours: "Lun–Sam 08:00–19:00 · Dim fermé",
    hoursToday: "Ouvert jusqu’à 19:00",
    openUntil: "19:00",
    openFrom: "08:00",
    rating: 4.7,
    reviewCount: 86,
    distanceM: 28,
    lat: 46.3972,
    lng: 6.9265,
    x: 47,
    y: 36,
    cover: "/offers/a1/epicerie-da-silva.webp",
    banner: "/shops/epicerie-da-silva.jpg",
    about: "Épicerie de quartier et produits du quotidien, au calme de la rue des Narcisses.",
    sells: ["Fruits", "Légumes", "Produits du quotidien"],
    registryNumber: "",
    website: "",
    photos: ["/offers/a1/epicerie-da-silva.webp"],
    color: "#2E7D32",
    reviews: [
      r("d1", "Marie L.", 5, "Toujours un sourire et des fruits mûrs à point. Le panier du jour est une habitude.", "14 sept. 2026"),
      r("d2", "Paulo S.", 4, "Petit magasin bien fourni, idéal quand on ne veut pas aller au supermarché.", "2 sept. 2026"),
    ],
  },
  {
    id: "shop_durgnat",
    name: "Boulangerie Durgnat",
    slug: "boulangerie-durgnat",
    category: "boulangerie",
    city: "Villeneuve",
    address: "Grand-Rue 61, 1844 Villeneuve",
    phone: "021 960 10 76",
    hours: "Mar–Sam 06:30–18:30 · Dim 07:00–12:30",
    hoursToday: "Ouvert jusqu’à 18:30",
    openUntil: "18:30",
    openFrom: "06:30",
    rating: 4.4,
    reviewCount: 516,
    distanceM: 60,
    lat: 46.3967,
    lng: 6.9256,
    x: 35,
    y: 46,
    cover: "/offers/a1/boulangerie-durgnat.webp",
    banner: "/shops/boulangerie-durgnat.jpg",
    about: "Boulangerie, pâtisserie et confiserie au cœur de la Grand-Rue.",
    sells: ["Pain", "Viennoiseries", "Pâtisserie", "Confiserie"],
    registryNumber: "",
    website: "https://durgnat.info",
    photos: ["/offers/a1/boulangerie-durgnat.webp"],
    color: "#D4A017",
    reviews: [
      r("du1", "Léa M.", 5, "Les viennoiseries du matin, encore tièdes. On ne va plus ailleurs.", "12 sept. 2026"),
      r("du2", "Marc D.", 5, "Pain de campagne incomparable. File d’attente le samedi, ça vaut le coup.", "3 sept. 2026"),
    ],
  },
  {
    id: "shop_macheret",
    name: "Macheret Fromage",
    slug: "macheret-fromage",
    category: "cremiere",
    city: "Villeneuve",
    address: "Grand-Rue 21, 1844 Villeneuve",
    phone: "021 960 13 75",
    hours: "Mar–Sam 08:00–18:00 · Dim fermé",
    hoursToday: "Ouvert jusqu’à 18:00",
    openUntil: "18:00",
    openFrom: "07:30",
    rating: 4.9,
    reviewCount: 67,
    distanceM: 118,
    lat: 46.3975,
    lng: 6.9248,
    x: 24,
    y: 30,
    cover: "/offers/a1/macheret-fromage.webp",
    banner: "/shops/macheret-fromage.jpg",
    about: "Fromagerie et spécialités locales. Conseils précis, caves bien tenues.",
    sells: ["Fromages", "Spécialités vaudoises", "Produits laitiers"],
    registryNumber: "",
    website: "https://macheret-fromage.com",
    photos: ["/offers/a1/macheret-fromage.webp"],
    color: "#F9A825",
    reviews: [
      r("m1", "Chloé V.", 5, "Le plateau découverte est parfait pour un apéro vaudois. Service impeccable.", "11 sept. 2026"),
      r("m2", "Henri P.", 5, "Tomme et Gruyère d’alpage. On sent le métier.", "28 août 2026"),
    ],
  },
  {
    id: "shop_fontaine",
    name: "Boucherie de la Fontaine",
    slug: "boucherie-fontaine",
    category: "boucherie",
    city: "Villeneuve",
    address: "Rue des Remparts 2, 1844 Villeneuve",
    phone: "021 960 15 57",
    hours: "Mar–Sam 07:30–18:00 · Dim fermé",
    hoursToday: "Ouvert jusqu’à 18:00",
    openUntil: "18:00",
    openFrom: "07:30",
    rating: 4.6,
    reviewCount: 54,
    distanceM: 95,
    lat: 46.3979,
    lng: 6.9262,
    x: 43,
    y: 23,
    cover: "/offers/a1/boucherie-fontaine.webp",
    banner: "/shops/boucherie-fontaine.jpg",
    about: "Boucherie artisanale de Villeneuve. Découpe du jour, grillades prêtes à cuire.",
    sells: ["Viandes", "Grillades", "Découpe du jour"],
    registryNumber: "",
    website: "",
    photos: ["/offers/a1/boucherie-fontaine.webp"],
    color: "#C62828",
    reviews: [
      r("f1", "Nico R.", 5, "Assortiment grillades nickel pour le week-end. Viande locale, conseil franc.", "9 sept. 2026"),
      r("f2", "Aline B.", 4, "Toujours frais. Un peu d’attente le vendredi soir.", "1 sept. 2026"),
    ],
  },
  {
    id: "shop_2freres",
    name: "Boucherie Les 2 Frères",
    slug: "boucherie-les-2-freres",
    category: "boucherie",
    city: "Villeneuve",
    address: "Grand-Rue 24, 1844 Villeneuve",
    phone: "021 960 10 64",
    hours: "Mar–Sam 07:30–18:00 · Dim fermé",
    hoursToday: "Ouvert jusqu’à 18:00",
    openUntil: "18:00",
    openFrom: "07:30",
    rating: 4.5,
    reviewCount: 71,
    distanceM: 126,
    lat: 46.3973,
    lng: 6.9246,
    x: 22,
    y: 34,
    cover: "/offers/a1/boucherie-2-freres.webp",
    banner: "/shops/boucherie-2-freres.jpg",
    about: "Boucherie-charcuterie au centre de Villeneuve. Saucisses fraîches et préparations maison.",
    sells: ["Viandes", "Charcuterie", "Saucisses"],
    registryNumber: "",
    website: "",
    photos: ["/offers/a1/boucherie-2-freres.webp"],
    color: "#8D3A32",
    reviews: [
      r("b1", "Serge T.", 5, "Les saucisses artisanales, recette de la maison. On en reprend chaque semaine.", "8 sept. 2026"),
    ],
  },
  {
    id: "shop_poulet",
    name: "Le Poulet d’Enfer",
    slug: "poulet-enfer",
    category: "rotisserie",
    city: "Villeneuve",
    address: "Route des Paquays, 1844 Villeneuve",
    phone: "079 381 25 55",
    hours: "Mar–Dim 11:00–19:00 · Lun fermé",
    hoursToday: "Ouvert jusqu’à 19:00",
    openUntil: "19:00",
    openFrom: "08:00",
    rating: 4.6,
    reviewCount: 118,
    distanceM: 340,
    lat: 46.3948,
    lng: 6.9292,
    x: 84,
    y: 83,
    cover: "/offers/a1/poulet-enfer.webp",
    banner: "/shops/poulet-enfer.jpg",
    about: "Poulets rôtis et restauration à emporter. Menu du soir, croûte dorée.",
    sells: ["Poulets rôtis", "Menus à emporter"],
    registryNumber: "",
    website: "",
    photos: ["/offers/a1/poulet-enfer.webp"],
    color: "#E65100",
    reviews: [
      r("p1", "Nadia K.", 5, "Le demi-poulet avec frites, simple et parfait. File à 18h30.", "13 sept. 2026"),
      r("p2", "Jonas W.", 4, "Goût de rôtissoire, pas de chichi. On y va après le boulot.", "30 août 2026"),
    ],
  },
  {
    id: "shop_kiosque",
    name: "Kiosque de la Gare",
    slug: "kiosque-gare",
    category: "kiosque",
    city: "Villeneuve",
    address: "Place de la Gare 1, 1844 Villeneuve",
    phone: "021 960 44 11",
    hours: "Lun–Dim 06:00–20:00",
    hoursToday: "Ouvert jusqu’à 20:00",
    openUntil: "20:00",
    openFrom: "06:00",
    rating: 4.3,
    reviewCount: 39,
    distanceM: 159,
    lat: 46.3958,
    lng: 6.9272,
    x: 57,
    y: 64,
    cover: "/offers/a1/kiosque-gare.webp",
    banner: "/shops/kiosque-gare.jpg",
    about: "Presse, snacks et boissons près des quais. Ouvert tôt pour les trains.",
    sells: ["Presse", "Snacks", "Boissons"],
    registryNumber: "",
    website: "",
    photos: ["/offers/a1/kiosque-gare.webp"],
    color: "#00897B",
    reviews: [
      r("k1", "Emma D.", 4, "Pratique avant le train. Combo pause express, pile ce qu’il faut.", "7 sept. 2026"),
    ],
  },
  {
    id: "shop_kiosque_leman",
    name: "Kiosque du Léman",
    slug: "kiosque-du-leman",
    category: "kiosque",
    city: "Villeneuve",
    address: "Grand-Rue 46, 1844 Villeneuve",
    phone: "021 960 11 64",
    hours: "Lun–Sam 07:00–19:00 · Dim 08:00–13:00",
    hoursToday: "Ouvert jusqu’à 19:00",
    openUntil: "19:00",
    openFrom: "08:00",
    rating: 4.4,
    reviewCount: 28,
    distanceM: 78,
    lat: 46.3969,
    lng: 6.9252,
    x: 30,
    y: 42,
    cover: "/offers/a1/kiosque-leman.webp",
    banner: "/shops/kiosque-leman.jpg",
    about: "Kiosque et produits pratiques du quotidien, en plein centre.",
    sells: ["Presse", "Snacks", "Produits pratiques"],
    registryNumber: "",
    website: "",
    photos: ["/offers/a1/kiosque-leman.webp"],
    color: "#00796B",
    reviews: [
      r("kl1", "Rita F.", 4, "Pause fraîcheur à prix doux. Accueil rapide.", "5 sept. 2026"),
    ],
  },
  {
    id: "shop_house",
    name: "The House Fortuné",
    slug: "the-house-fortune",
    category: "coiffure",
    city: "Villeneuve",
    address: "Grand-Rue 18, 1844 Villeneuve",
    phone: "077 946 96 13",
    hours: "Mar–Sam 09:00–18:30 · Dim–Lun fermé",
    hoursToday: "Ouvert jusqu’à 18:30",
    openUntil: "18:30",
    openFrom: "06:30",
    rating: 4.8,
    reviewCount: 45,
    distanceM: 140,
    lat: 46.3975,
    lng: 6.9245,
    x: 20,
    y: 30,
    cover: "/offers/a1/the-house-fortune.webp",
    banner: "/shops/the-house-fortune.jpg",
    about: "Salon de coiffure à Villeneuve. Coupes soignées, ambiance calme.",
    sells: ["Coupes", "Brushing"],
    registryNumber: "",
    website: "https://salonkee.ch/salon/the-house",
    photos: ["/offers/a1/the-house-fortune.webp"],
    color: "#6D4C41",
    reviews: [
      r("h1", "Camille D.", 5, "Créneau découverte bien expliqué. On ressort avec une coupe nette.", "10 sept. 2026"),
    ],
  },
  {
    id: "shop_byhani",
    name: "By Hani",
    slug: "by-hani",
    category: "coiffure",
    city: "Villeneuve",
    address: "Grand-Rue 66, 1844 Villeneuve",
    phone: "079 924 74 19",
    hours: "Mar–Sam 09:00–18:30 · Dim–Lun fermé",
    hoursToday: "Ouvert jusqu’à 18:30",
    openUntil: "18:30",
    openFrom: "06:30",
    rating: 4.7,
    reviewCount: 33,
    distanceM: 65,
    lat: 46.3965,
    lng: 6.9259,
    x: 39,
    y: 50,
    cover: "/offers/a1/by-hani.webp",
    banner: "/shops/by-hani.jpg",
    about: "Salon de coiffure et beauté. Formules découverte soin + brushing.",
    sells: ["Coupes", "Brushing", "Soins"],
    registryNumber: "",
    website: "https://salonkee.ch/salon/salon-de-coiffure-mixte-by-hani",
    photos: ["/offers/a1/by-hani.webp"],
    color: "#AD1457",
    isNew: true,
    reviews: [
      r("bh1", "Sara M.", 5, "Soin + brushing, résultat lumineux. Hani prend le temps.", "15 sept. 2026"),
    ],
  },
  {
    id: "shop_elegance",
    name: "Élégance Barber Shop",
    slug: "elegance-barber-shop",
    category: "coiffure",
    city: "Villeneuve",
    address: "Grand-Rue 17, 1844 Villeneuve",
    phone: "021 968 12 31",
    hours: "Mar–Sam 09:00–19:00 · Dim–Lun fermé",
    hoursToday: "Ouvert jusqu’à 19:00",
    openUntil: "19:00",
    openFrom: "08:00",
    rating: 4.7,
    reviewCount: 156,
    distanceM: 130,
    lat: 46.3976,
    lng: 6.9247,
    x: 23,
    y: 29,
    cover: "/offers/a1/elegance-barber.webp",
    banner: "/shops/elegance-barber.jpg",
    about: "Barber shop au centre de Villeneuve. Coupe homme, barbe, créneaux découverte.",
    sells: ["Coupe homme", "Barbe"],
    registryNumber: "",
    website: "https://salonkee.ch/salon/elegance-barber-shop-villeneuve",
    photos: ["/offers/a1/elegance-barber.webp"],
    color: "#37474F",
    isNew: true,
    reviews: [
      r("e1", "Karim A.", 5, "Coupe nette, discussion facile. Tarif découverte honnête.", "6 sept. 2026"),
    ],
  },
  {
    id: "shop_soslessive",
    name: "SOSLESSIVE Riviera",
    slug: "soslessive-riviera",
    category: "laverie",
    city: "Villeneuve",
    address: "Grand-Rue 2, 1844 Villeneuve",
    phone: "079 799 09 89",
    hours: "Lun–Sam 08:00–18:30 · Dim fermé",
    hoursToday: "Ouvert jusqu’à 18:30",
    openUntil: "18:30",
    openFrom: "06:30",
    rating: 4.5,
    reviewCount: 22,
    distanceM: 193,
    lat: 46.398,
    lng: 6.9241,
    x: 15,
    y: 21,
    cover: "/offers/a1/sos-lessive.webp",
    banner: "/shops/sos-lessive.jpg",
    about: "Laverie et service de lessive à Villeneuve. Couettes, linge du quotidien.",
    sells: ["Lessive", "Couettes", "Linge"],
    registryNumber: "",
    website: "",
    photos: ["/offers/a1/sos-lessive.webp"],
    color: "#1565C0",
    isNew: true,
    reviews: [
      r("s1", "Inès P.", 4, "Offre couette du mois, rendu propre et plié. Pratique.", "4 sept. 2026"),
    ],
  },
];

export const OFFERS: Offer[] = [
  {
    id: "a1_dasilva_panier",
    merchantId: "shop_dasilva",
    title: "Panier fruits du jour",
    image: "/offers/a1/epicerie-da-silva.webp",
    originalPrice: 10.5,
    price: 6.9,
    stock: 8,
    until: "19:00",
    type: "PROMO",
    unit: "panier",
    flags: flagsForType("PROMO", 10.5, 6.9),
  },
  {
    id: "a1_durgnat_viennoiseries",
    merchantId: "shop_durgnat",
    title: "4 viennoiseries du jour",
    image: "/offers/a1/boulangerie-durgnat.webp",
    originalPrice: 9.2,
    price: 5.9,
    stock: 7,
    until: "18:30",
    type: "DERNIERE_MINUTE",
    unit: "lot",
    flags: flagsForType("DERNIERE_MINUTE", 9.2, 5.9),
  },
  {
    id: "a1_macheret_plateau",
    merchantId: "shop_macheret",
    title: "Plateau découverte vaudois",
    image: "/offers/a1/macheret-fromage.webp",
    originalPrice: 19.5,
    price: 14.9,
    stock: 4,
    until: "18:00",
    type: "EXCLUSIVITE",
    unit: "plateau",
    flags: flagsForType("EXCLUSIVITE", 19.5, 14.9),
  },
  {
    id: "a1_fontaine_grillades",
    merchantId: "shop_fontaine",
    title: "Assortiment grillades",
    image: "/offers/a1/boucherie-fontaine.webp",
    originalPrice: 24.9,
    price: 18.9,
    stock: 5,
    until: "18:00",
    type: "PROMO",
    unit: "lot",
    flags: flagsForType("PROMO", 24.9, 18.9),
  },
  {
    id: "a1_2freres_saucisses",
    merchantId: "shop_2freres",
    title: "Saucisses artisanales",
    image: "/offers/a1/boucherie-2-freres.webp",
    originalPrice: 15.9,
    price: 11.9,
    stock: 6,
    until: "18:00",
    type: "ARRIVAGE",
    unit: "lot",
    flags: flagsForType("ARRIVAGE", 15.9, 11.9),
  },
  {
    id: "a1_poulet_menu",
    merchantId: "shop_poulet",
    title: "Menu poulet rôti",
    image: "/offers/a1/poulet-enfer.webp",
    originalPrice: 17.5,
    price: 13.9,
    stock: 6,
    until: "19:00",
    type: "FLASH",
    unit: "menu",
    flags: flagsForType("FLASH", 17.5, 13.9),
  },
  {
    id: "a1_kiosque_combo",
    merchantId: "shop_kiosque",
    title: "Combo pause express",
    image: "/offers/a1/kiosque-gare.webp",
    originalPrice: 8.1,
    price: 5.9,
    stock: 0,
    until: "14:30",
    type: "FLASH",
    unit: "combo",
    flags: flagsForType("FLASH", 8.1, 5.9),
  },
  {
    id: "a1_leman_combo",
    merchantId: "shop_kiosque_leman",
    title: "Pause fraîcheur",
    image: "/offers/a1/kiosque-leman.webp",
    originalPrice: 6.8,
    price: 4.9,
    stock: 9,
    until: "19:00",
    type: "PROMO",
    unit: "combo",
    flags: flagsForType("PROMO", 6.8, 4.9),
  },
  {
    id: "a1_house_coupe",
    merchantId: "shop_house",
    title: "Créneau coupe cette semaine",
    image: "/offers/a1/the-house-fortune.webp",
    originalPrice: 39,
    price: 29,
    stock: 3,
    until: "18:30",
    type: "EXCLUSIVITE",
    unit: "créneau",
    flags: flagsForType("EXCLUSIVITE", 39, 29),
  },
  {
    id: "a1_byhani_soin",
    merchantId: "shop_byhani",
    title: "Soin + brushing",
    image: "/offers/a1/by-hani.webp",
    originalPrice: 55,
    price: 39,
    stock: 4,
    until: "18:30",
    type: "PROMO",
    unit: "créneau",
    flags: flagsForType("PROMO", 55, 39),
  },
  {
    id: "a1_elegance_barber",
    merchantId: "shop_elegance",
    title: "Coupe homme découverte",
    image: "/offers/a1/elegance-barber.webp",
    originalPrice: 32,
    price: 24,
    stock: 3,
    until: "19:00",
    type: "FLASH",
    unit: "créneau",
    flags: flagsForType("FLASH", 32, 24),
  },
  {
    id: "a1_lessive_couette",
    merchantId: "shop_soslessive",
    title: "Nettoyage couette",
    image: "/offers/a1/sos-lessive.webp",
    originalPrice: 26,
    price: 19.9,
    stock: 6,
    until: "18:30",
    type: "PROMO",
    unit: "pièce",
    flags: flagsForType("PROMO", 26, 19.9),
  },
];

// === SUPABASE LIVE DATA ===
// Variables mutables qui stockent les données Supabase (mises à jour au runtime)
let _supabaseMerchants: Merchant[] | null = null;
let _supabaseOffers: Offer[] | null = null;

/** Met à jour les merchants depuis Supabase (appelé par SupabaseLoader) */
export function setSupabaseMerchants(merchants: Merchant[]) {
  _supabaseMerchants = merchants;
}

/** Met à jour les offres depuis Supabase (appelé par SupabaseLoader) */
export function setSupabaseOffers(offers: Offer[]) {
  _supabaseOffers = offers;
}

/** Retourne la liste active des merchants (Supabase si chargé, sinon statique) */
export function getActiveMerchants(): Merchant[] {
  return _supabaseMerchants ?? MERCHANTS;
}

/** Retourne la liste active des offres (Supabase si chargé, sinon statique) */
export function getActiveOffers(): Offer[] {
  return _supabaseOffers ?? OFFERS;
}

export function getMerchant(id: string) {
  const source = _supabaseMerchants ?? MERCHANTS;
  return source.find((m) => m.id === id) ?? MERCHANTS.find((m) => m.id === id);
}

export function getOffer(id: string) {
  const source = _supabaseOffers ?? OFFERS;
  return source.find((o) => o.id === id) ?? OFFERS.find((o) => o.id === id);
}

export function offersForMerchant(merchantId: string) {
  const source = _supabaseOffers ?? OFFERS;
  return source.filter((o) => o.merchantId === merchantId);
}

export function exploreMatches(merchantCategory: CategoryId, filter: string) {
  if (filter === "all") return true;
  if (filter === "alimentation") return FOOD.includes(merchantCategory);
  if (filter === "services") return merchantCategory === "laverie";
  if (filter === "beaute") return merchantCategory === "coiffure";
  return merchantCategory === filter;
}

export function mergeOffers(extra: Offer[], hidden: string[]): Offer[] {
  const source = _supabaseOffers ?? OFFERS;
  return [...source.filter((o) => !hidden.includes(o.id)), ...extra];
}

export function findOffer(id: string, extra: Offer[], hidden: string[]) {
  if (hidden.includes(id)) return undefined;
  return extra.find((o) => o.id === id) ?? getOffer(id);
}

export function liveOffersForMerchant(
  merchantId: string,
  extra: Offer[],
  hidden: string[],
) {
  return mergeOffers(extra, hidden).filter((o) => o.merchantId === merchantId);
}

function minutesAgo(m: number) {
  return new Date(Date.now() - m * 60_000).toISOString();
}

export function demoInbox(): Reservation[] {
  const dasilva = getMerchant("shop_dasilva")!;
  const durgnat = getMerchant("shop_durgnat")!;
  const panier = getOffer("a1_dasilva_panier")!;
  const vien = getOffer("a1_durgnat_viennoiseries")!;
  return [
    {
      id: "a1_resa_1",
      offerId: panier.id,
      merchantId: dasilva.id,
      title: panier.title,
      merchantName: dasilva.name,
      image: panier.image,
      qty: 1,
      unitPrice: panier.price,
      originalPrice: panier.originalPrice,
      until: panier.until,
      distanceM: dasilva.distanceM,
      address: dasilva.address,
      createdAt: minutesAgo(12),
      status: "pending",
      code: "EC-4821",
      mine: false,
      clientName: "Marie",
      unit: panier.unit,
    },
    {
      id: "a1_resa_2",
      offerId: vien.id,
      merchantId: durgnat.id,
      title: vien.title,
      merchantName: durgnat.name,
      image: vien.image,
      qty: 1,
      unitPrice: vien.price,
      originalPrice: vien.originalPrice,
      until: vien.until,
      distanceM: durgnat.distanceM,
      address: durgnat.address,
      createdAt: minutesAgo(90),
      status: "confirmed",
      code: "EC-3104",
      mine: false,
      clientName: "Nico",
      unit: vien.unit,
    },
  ];
}
