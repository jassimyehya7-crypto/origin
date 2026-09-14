/**
 * SMS outbound stub — no provider wired yet.
 * TODO: plug Twilio / MessageBird / Swisscom when keys land in env.
 */

export type ReservationSmsPayload = {
  to: string;
  code: string;
  reservationId: string;
  offerTitle?: string;
};

export type SmsResult = {
  ok: true;
  stub: true;
  to: string;
  body: string;
  provider: "stub";
};

function appBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://epicerie.club";
}

export function buildReservationSmsBody(p: ReservationSmsPayload): string {
  const link = `${appBase()}/reservations`;
  return `Épicerie Club — ta demande est envoyée. Code ${p.code}. Suivi : ${link}`;
}

/** Fire-and-forget stub: logs clearly, returns the message that would be sent. */
export async function sendReservationSms(
  p: ReservationSmsPayload
): Promise<SmsResult> {
  const body = buildReservationSmsBody(p);
  // TODO(sms): replace stub with real provider (Twilio/MessageBird/…).
  console.info("[sms:stub] reservation code", {
    to: p.to,
    code: p.code,
    reservationId: p.reservationId,
    body,
  });
  return { ok: true, stub: true, to: p.to, body, provider: "stub" };
}
