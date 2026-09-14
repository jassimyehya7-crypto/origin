/** Client-safe phone helpers (no Node fs). */

export function normalizePhoneKey(phone: string | undefined | null): string {
  if (!phone) return "";
  return phone.replace(/[\s.\-()]/g, "").trim();
}

export function hasClientPhone(phone: string | undefined | null): boolean {
  return Boolean(normalizePhoneKey(phone));
}

/**
 * Swiss mobile/landline in common forms:
 * 079… / 078… / 076… / 077… / 075… / 074…
 * +4179… / 004179… / 4179…
 * also 0XX landlines (021, 022, 024, 026, 027, 031, 032, 033, 034, 041, 043, 044, 051, 052, 055, 056, 058, 061, 062, 071, 081, 091)
 */
export function isValidSwissPhone(phone: string | undefined | null): boolean {
  const raw = normalizePhoneKey(phone);
  if (!raw) return false;

  let digits = raw;
  if (digits.startsWith("+41")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("0041")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("41") && digits.length >= 11) digits = "0" + digits.slice(2);

  if (!/^0\d+$/.test(digits)) return false;
  // CH national numbers: 10 digits (0 + 9)
  if (digits.length !== 10) return false;

  const mobile = /^07[4-9]\d{7}$/;
  const landline =
    /^0(21|22|24|26|27|31|32|33|34|41|43|44|51|52|55|56|58|61|62|71|81|91)\d{7}$/;
  return mobile.test(digits) || landline.test(digits);
}

/** Display form e.g. 079 123 45 67 */
export function formatSwissPhoneDisplay(phone: string | undefined | null): string {
  const raw = normalizePhoneKey(phone);
  if (!raw) return "";
  let digits = raw;
  if (digits.startsWith("+41")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("0041")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("41") && digits.length >= 11) digits = "0" + digits.slice(2);
  if (digits.length !== 10) return phone?.trim() || "";
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
}

/** E.164-ish for providers: +41XXXXXXXXX */
export function toE164CH(phone: string | undefined | null): string | null {
  if (!isValidSwissPhone(phone)) return null;
  const raw = normalizePhoneKey(phone)!;
  let digits = raw;
  if (digits.startsWith("+41")) digits = digits.slice(3);
  else if (digits.startsWith("0041")) digits = digits.slice(4);
  else if (digits.startsWith("41") && digits.length >= 11) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return `+41${digits}`;
}
