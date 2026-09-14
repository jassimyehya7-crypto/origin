/** Soft profile keys — device-local, no auth account. */
export const EC_PRENOM_KEY = "ec_prenom";
export const EC_PHONE_KEY = "ec_phone";
export const EC_SOFT_ID_KEY = "ec_soft_id";
export const EC_PHONE_RISK_KEY = "ec_phone_risk";
export const EC_STRIKE_NOTE_KEY = "ec_strike_note";
export const EC_RISK_DISMISS_KEY = "ec_risk_banner_dismissed";

export type SoftProfile = {
  prenom: string;
  phone: string;
  softUserId: string;
};

export function generateSoftUserId(): string {
  return `su_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function readSoftProfile(): SoftProfile | null {
  if (typeof window === "undefined") return null;
  const prenom = (localStorage.getItem(EC_PRENOM_KEY) || "").trim();
  const phone = (localStorage.getItem(EC_PHONE_KEY) || "").trim();
  let softUserId = localStorage.getItem(EC_SOFT_ID_KEY) || "";
  if (!softUserId) {
    softUserId = generateSoftUserId();
    localStorage.setItem(EC_SOFT_ID_KEY, softUserId);
  }
  if (!prenom && !phone) {
    return { prenom: "", phone: "", softUserId };
  }
  return { prenom, phone, softUserId };
}

export function ensureSoftUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(EC_SOFT_ID_KEY) || "";
  if (!id) {
    id = generateSoftUserId();
    localStorage.setItem(EC_SOFT_ID_KEY, id);
  }
  return id;
}

export function saveSoftProfile(prenom: string, phone: string): SoftProfile {
  const softUserId = ensureSoftUserId();
  const p = prenom.trim();
  const ph = phone.trim();
  if (p) localStorage.setItem(EC_PRENOM_KEY, p);
  else localStorage.removeItem(EC_PRENOM_KEY);
  if (ph) localStorage.setItem(EC_PHONE_KEY, ph);
  else localStorage.removeItem(EC_PHONE_KEY);
  return { prenom: p, phone: ph, softUserId };
}

export function clearSoftProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EC_PRENOM_KEY);
  localStorage.removeItem(EC_PHONE_KEY);
  localStorage.removeItem(EC_SOFT_ID_KEY);
  localStorage.removeItem(EC_PHONE_RISK_KEY);
  localStorage.removeItem(EC_STRIKE_NOTE_KEY);
  localStorage.removeItem(EC_RISK_DISMISS_KEY);
}

/** Display name for Pro inbox / API — never « Demo Client ». */
export function resolveClientName(prenom?: string | null): string {
  const p = (prenom || "").trim();
  return p || "Client";
}
