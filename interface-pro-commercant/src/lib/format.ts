export function chf(value: number) {
  const [int, dec] = value.toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `CHF ${grouped}.${dec}`;
}

export function distLabel(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  const label = km >= 10 ? km.toFixed(0) : km.toFixed(1).replace(".", ",");
  return `${label} km`;
}

export function walkMinutes(meters: number) {
  return Math.max(1, Math.round(meters / 70));
}

export function discountPct(original?: number, price?: number) {
  if (!original || price == null || original <= price) return 0;
  return Math.round((1 - price / original) * 100);
}

export function todayStamp() {
  return new Date().toLocaleDateString("fr-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function pickupCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `EC-${n}`;
}
