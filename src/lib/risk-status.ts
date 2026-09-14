/**
 * Client-safe risk / strike status helpers.
 * Server source of truth: phone-risk.ts (phone key and/or soft:id).
 * SMS deferred for MVP — in-app messages only.
 */

export type ClientRiskStatus = {
  strikeCount: number;
  bannedUntil: string | null;
  banned: boolean;
  message: string | null;
  /** Legacy alias */
  risk: boolean;
};

/** @deprecated use EC_RISK_DISMISS_KEY from soft-profile */
export const RISK_DISMISS_KEY = "ec_risk_banner_dismissed";

/** Warm French copy for strikes / ban (MVP, no SMS). */
export function riskMessage(
  strikeCount: number,
  bannedUntil?: string | null
): string | null {
  const banned =
    Boolean(bannedUntil) &&
    new Date(bannedUntil as string).getTime() > Date.now();

  if (banned && bannedUntil) {
    const date = new Date(bannedUntil).toLocaleDateString("fr-CH");
    return `Réservations en pause jusqu’au ${date} (7 jours).`;
  }
  if (strikeCount >= 3) {
    // Should normally be banned; fallback copy
    return "Réservations en pause (7 jours).";
  }
  if (strikeCount === 2) {
    return "2e absence. Une de plus = pause de 7 jours.";
  }
  if (strikeCount === 1) {
    return "Tu as manqué un retrait. À la 3e fois, pause de 7 jours.";
  }
  return null;
}

export function normalizeRiskPayload(raw: {
  strikes?: number;
  strikeCount?: number;
  noShows?: number;
  paused?: boolean;
  banned?: boolean;
  pausedUntil?: string | null;
  bannedUntil?: string | null;
  note?: string | null;
  message?: string | null;
  risk?: boolean;
}): ClientRiskStatus {
  const strikeCount = Math.max(
    0,
    Number(raw.strikeCount ?? raw.strikes ?? raw.noShows ?? 0) || 0
  );
  const bannedUntil =
    (raw.bannedUntil || raw.pausedUntil || null) &&
    String(raw.bannedUntil || raw.pausedUntil)
      ? String(raw.bannedUntil || raw.pausedUntil)
      : null;
  const banned =
    Boolean(raw.banned ?? raw.paused) &&
    Boolean(bannedUntil) &&
    new Date(bannedUntil as string).getTime() > Date.now();
  const message =
    (banned
      ? riskMessage(strikeCount, bannedUntil)
      : raw.message || raw.note || riskMessage(strikeCount, bannedUntil)) ||
    null;

  return {
    strikeCount: banned ? Math.max(strikeCount, 3) : strikeCount,
    bannedUntil: banned ? bannedUntil : null,
    banned,
    message: strikeCount > 0 || banned ? message : null,
    risk: strikeCount >= 1 || banned,
  };
}

/** Fetch live risk for soft profile (+ optional phone). */
export async function fetchClientRisk(opts: {
  phone?: string | null;
  softUserId?: string | null;
}): Promise<ClientRiskStatus> {
  const params = new URLSearchParams();
  if (opts.softUserId) params.set("softUserId", opts.softUserId);
  if (opts.phone) params.set("phone", opts.phone);
  const res = await fetch(`/api/risk?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return {
      strikeCount: 0,
      bannedUntil: null,
      banned: false,
      message: null,
      risk: false,
    };
  }
  const data = await res.json();
  return normalizeRiskPayload(data);
}
