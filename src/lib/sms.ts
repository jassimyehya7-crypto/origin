/**
 * SMS via seven.io — POST https://gateway.seven.io/api/sms
 * Env: SEVEN_API_KEY (required), SEVEN_FROM (optional sender, max 11 alnum)
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
      provider: "seven.io";
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
      provider: "seven.io" | "stub";
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

export function buildConfirmedSmsBody(p: ReservationSmsPayload): string {
  const link = `${appBase()}/reservations`;
  return `Épicerie Club — réservation confirmée. Code ${p.code}. Suivi : ${link}`;
}

export async function sendReservationSms(
  p: ReservationSmsPayload & { kind?: "demande" | "confirmee" }
): Promise<SmsResult> {
  const body =
    p.kind === "confirmee"
      ? buildConfirmedSmsBody(p)
      : buildReservationSmsBody(p);
  const e164 = toE164CH(p.to) || p.to.trim();
  const apiKey = process.env.SEVEN_API_KEY?.trim();
  const from = process.env.SEVEN_FROM?.trim() || "EpicerieClb"; // max 11 alnum

  if (!apiKey) {
    console.info("[sms:stub] missing SEVEN_API_KEY", {
      to: e164,
      code: p.code,
      reservationId: p.reservationId,
      body,
    });
    return { ok: true, stub: true, to: e164, body, provider: "stub" };
  }

  try {
    const form = new URLSearchParams();
    form.set("to", e164);
    form.set("text", body);
    form.set("from", from.slice(0, 11));
    form.set("json", "1");

    const res = await fetch("https://gateway.seven.io/api/sms", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const data = (await res.json().catch(() => ({}))) as {
      success?: string | boolean | number;
      messages?: Array<{ id?: string; success?: boolean; error?: string; recipient?: string }>;
      total_price?: number;
      error?: string;
      code?: number | string;
    };

    // seven returns success: "100" or numeric codes; also HTTP 200 with error payload
    const successFlag = data.success;
    const successCode = String(successFlag ?? "");
    const ok =
      res.ok &&
      (successFlag === true ||
        successCode === "100" ||
        (Array.isArray(data.messages) &&
          data.messages.some(
            (m) => m.success === true || (m.success === undefined && !m.error)
          )));

    if (!ok) {
      const err =
        data.error ||
        data.messages?.[0]?.error ||
        `seven status ${String(successFlag ?? res.status)}`;
      console.error("[sms:seven.io] send failed", { to: e164, err, data });
      return {
        ok: false,
        stub: false,
        to: e164,
        body,
        provider: "seven.io",
        error: String(err),
      };
    }

    const messageId = data.messages?.[0]?.id;
    console.info("[sms:seven.io] sent", {
      to: e164,
      code: p.code,
      reservationId: p.reservationId,
      messageId,
    });

    return {
      ok: true,
      stub: false,
      to: e164,
      body,
      provider: "seven.io",
      messageId,
    };
  } catch (e) {
    const err = e instanceof Error ? e.message : "network_error";
    console.error("[sms:seven.io] exception", err);
    return {
      ok: false,
      stub: false,
      to: e164,
      body,
      provider: "seven.io",
      error: err,
    };
  }
}
