import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCHF(amount: number): string {
  return `CHF ${amount.toFixed(2).replace(".", ",")}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-CH", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function todayEndOfDayISO(openUntil = "19:00"): string {
  const [h, m] = openUntil.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function generateCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `EC-${n}`;
}

export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function percent(n: number, d: number): number {
  if (d === 0) return 0;
  return Math.round((n / d) * 100);
}

export function discountPercent(price: number, original?: number): number | null {
  if (!original || original <= price) return null;
  return Math.round(((original - price) / original) * 100);
}

/** Demo client pin — centre Villeneuve (Place de la Gare approx.) */
const DEMO_USER = { lat: 46.39705, lng: 6.9262 };

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Useful walk distance for cards: « À 280 m » or « À 4 min ». */
export function formatWalkDistance(lat: number, lng: number): string {
  const raw = haversineMeters(DEMO_USER, { lat, lng });
  const meters = Math.max(50, Math.round(raw / 50) * 50);
  if (meters < 800) return `À ${meters} m`;
  const mins = Math.max(1, Math.round(meters / 80));
  return `À ${mins} min`;
}


/** True if string looks like emoji / symbol icon (not a letter mark). */
export function isEmojiIcon(value?: string | null): boolean {
  if (!value) return false;
  const s = value.trim();
  if (!s) return false;
  // Allow short alphanumeric initials (incl. accented Latin)
  if (/^[A-Za-zÀ-ÿ0-9]{1,3}$/.test(s)) return false;
  return true;
}

/** Letter/initial for shop or offer visuals (no emoji). */
export function visualMark(label: string, stored?: string | null): string {
  if (stored && !isEmojiIcon(stored)) {
    return stored.trim().slice(0, 3).toUpperCase();
  }
  const words = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (words[0]?.slice(0, 2) || "?").toUpperCase();
}
