/**
 * SMS via Sms.to — https://api.sms.to/sms/send
 * Env: SMS_TO_API_KEY (required), SMS_TO_SENDER_ID (optional, default EpicerieClub)
 */

import { toE164CH } from "@/lib/phone";

export type ReservationSmsPayload = {
  to: string;
  code: string;
  reservationId: string;
  offerTitle?: string;
};

export type SmsResult =
  | {
      ok: true;
      stub: false;
      to: string;
      body: string;
      provider: "sms.to";
      messageId?: string;
    }
  | {
      ok: true;
      stub: true;
      to: string;
      body: string;
      provider: "stub";
    }
  | {
      ok: false;
      stub: boolean;
      to: string;
      body: string;
      provider: "sms.to" | "stub";
      error: string;
    };

function appBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://epicerie-club.vercel.app";
}

export function buildReservationSmsBody(p: ReservationSmsPayload): string {
  const link = `${appBase()}/reservations`;
  return `Épicerie Club — demande envoyée. Code ${p.code}. Suivi : ${link}`;
}

export async function sendReservationSms(
  p: ReservationSmsPayload
): Promise<SmsResult> {
  const body = buildReservationSmsBody(p);
  const e164 = toE164CH(p.to) || p.to.trim();
  const apiKey = process.env.SMS_TO_API_KEY?.trim();
  const senderId =
    process.env.SMS_TO_SENDER_ID?.trim() || "EpicerieClub";

  if (!apiKey) {
    console.info("[sms:stub] missing SMS_TO_API_KEY", {
      to: e164,
      code: p.code,
      reservationId: p.reservationId,
      body,
    });
    return { ok: true, stub: true, to: e164, body, provider: "stub" };
  }

  try {
    const res = await fetch("https://api.sms.to/sms/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        message: body,
        to: e164,
        sender_id: senderId,
        bypass_optout: true,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      success?: boolean;
      message_id?: string;
      error?: string | { message?: string };
    };

    if (!res.ok) {
      const err =
        typeof data.error === "string"
          ? data.error
          : data.error?.message || data.message || `HTTP ${res.status}`;
      console.error("[sms:sms.to] send failed", { to: e164, err, data });
      return {
        ok: false,
        stub: false,
        to: e164,
        body,
        provider: "sms.to",
        error: err,
      };
    }

    console.info("[sms:sms.to] sent", {
      to: e164,
      code: p.code,
      reservationId: p.reservationId,
      messageId: data.message_id,
    });

    return {
      ok: true,
      stub: false,
      to: e164,
      body,
      provider: "sms.to",
      messageId: data.message_id,
    };
  } catch (e) {
    const err = e instanceof Error ? e.message : "network_error";
    console.error("[sms:sms.to] exception", err);
    return {
      ok: false,
      stub: false,
      to: e164,
      body,
      provider: "sms.to",
      error: err,
    };
  }
}
