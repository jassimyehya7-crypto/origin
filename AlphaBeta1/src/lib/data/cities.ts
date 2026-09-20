export type MapCity = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  unlocked?: boolean;
};

/** Villeneuve VD commune — only unlocked city. */
export const VILLENEUVE_BOUNDS = {
  south: 46.384,
  north: 46.4085,
  west: 6.898,
  east: 6.952,
};

export const VILLENEUVE_CENTER = { lat: 46.3968, lng: 6.9262 };

export const MAP_CITIES: MapCity[] = [
  { id: "villeneuve", name: "Villeneuve", lat: 46.3968, lng: 6.9262, unlocked: true },
  { id: "montreux", name: "Montreux", lat: 46.431, lng: 6.911 },
  { id: "veytaux", name: "Veytaux", lat: 46.42, lng: 6.927 },
  { id: "clarens", name: "Clarens", lat: 46.442, lng: 6.888 },
  { id: "vevey", name: "Vevey", lat: 46.462, lng: 6.843 },
  { id: "tourdepeilz", name: "La Tour-de-Peilz", lat: 46.453, lng: 6.86 },
  { id: "blonay", name: "Blonay", lat: 46.465, lng: 6.896 },
  { id: "stlegier", name: "St-Légier", lat: 46.472, lng: 6.875 },
  { id: "noville", name: "Noville", lat: 46.382, lng: 6.898 },
  { id: "chessel", name: "Chessel", lat: 46.375, lng: 6.912 },
  { id: "rennaz", name: "Rennaz", lat: 46.373, lng: 6.918 },
  { id: "roche", name: "Roche", lat: 46.351, lng: 6.927 },
  { id: "aigle", name: "Aigle", lat: 46.319, lng: 6.969 },
  { id: "ollon", name: "Ollon", lat: 46.296, lng: 6.993 },
  { id: "bex", name: "Bex", lat: 46.252, lng: 7.013 },
  { id: "bouveret", name: "Le Bouveret", lat: 46.354, lng: 6.859 },
  { id: "vouvry", name: "Vouvry", lat: 46.338, lng: 6.891 },
  { id: "monthey", name: "Monthey", lat: 46.255, lng: 6.954 },
  { id: "stmaurice", name: "St-Maurice", lat: 46.214, lng: 7.003 },
  { id: "martigny", name: "Martigny", lat: 46.103, lng: 7.072 },
  { id: "sion", name: "Sion", lat: 46.233, lng: 7.36 },
  { id: "lausanne", name: "Lausanne", lat: 46.52, lng: 6.632 },
  { id: "pully", name: "Pully", lat: 46.51, lng: 6.662 },
  { id: "lutry", name: "Lutry", lat: 46.503, lng: 6.686 },
  { id: "morges", name: "Morges", lat: 46.511, lng: 6.498 },
  { id: "nyon", name: "Nyon", lat: 46.383, lng: 6.239 },
  { id: "geneve", name: "Genève", lat: 46.204, lng: 6.143 },
  { id: "evian", name: "Évian-les-Bains", lat: 46.401, lng: 6.589 },
  { id: "thonon", name: "Thonon-les-Bains", lat: 46.371, lng: 6.479 },
  { id: "yverdon", name: "Yverdon-les-Bains", lat: 46.778, lng: 6.641 },
  { id: "fribourg", name: "Fribourg", lat: 46.806, lng: 7.162 },
  { id: "neuchatel", name: "Neuchâtel", lat: 46.99, lng: 6.929 },
  { id: "berne", name: "Berne", lat: 46.948, lng: 7.447 },
  { id: "sierre", name: "Sierre", lat: 46.292, lng: 7.532 },
];

export function inVilleneuve(lat: number, lng: number) {
  const b = VILLENEUVE_BOUNDS;
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
}

export function nearestLockedCity(lat: number, lng: number): MapCity {
  let best = MAP_CITIES[1];
  let bestD = Infinity;
  for (const city of MAP_CITIES) {
    if (city.unlocked) continue;
    const d = (city.lat - lat) ** 2 + (city.lng - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = city;
    }
  }
  return best;
}
