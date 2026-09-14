/** Client-safe phone helpers (no Node fs). */
export function normalizePhoneKey(phone: string | undefined | null): string {
  if (!phone) return "";
  return phone.replace(/[\s.\-()]/g, "").trim();
}

export function hasClientPhone(phone: string | undefined | null): boolean {
  return Boolean(normalizePhoneKey(phone));
}
