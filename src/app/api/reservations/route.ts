import { NextRequest, NextResponse } from "next/server";
import {
  createReservation,
  getOffer,
  getReservations,
  getShop,
} from "@/lib/store";
import { getStrikeStatus, isPaused } from "@/lib/phone-risk";
import {
  formatSwissPhoneDisplay,
  isValidSwissPhone,
  toE164CH,
} from "@/lib/phone";
import { sendReservationSms } from "@/lib/sms";
import { normalizeRiskPayload } from "@/lib/risk-status";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId") || undefined;
  const clientPhone = searchParams.get("clientPhone") || undefined;
  const softUserId = searchParams.get("softUserId") || undefined;
  const status = searchParams.get("status") || undefined;
  const riskPhone = searchParams.get("riskPhone");

  if (riskPhone !== null && searchParams.has("riskPhone")) {
    const statusRisk = await getStrikeStatus({
      phone: riskPhone || "",
      softUserId,
    });
    const pause = await isPaused({ phone: riskPhone || "", softUserId });
    const normalized = normalizeRiskPayload({
      strikes: statusRisk.strikes,
      strikeCount: statusRisk.strikes,
      noShows: statusRisk.noShows,
      paused: pause.paused,
      banned: pause.paused,
      pausedUntil: pause.until ?? statusRisk.pausedUntil,
      bannedUntil: pause.until ?? statusRisk.pausedUntil,
      note: statusRisk.note,
      message: pause.message || statusRisk.note,
      risk: statusRisk.risk,
    });
    return NextResponse.json({
      phoneRisk: {
        risk: normalized.risk,
        noShows: normalized.strikeCount,
        strikes: normalized.strikeCount,
        strikeCount: normalized.strikeCount,
        note: normalized.message,
        message: normalized.message,
        paused: normalized.banned,
        banned: normalized.banned,
        pausedUntil: normalized.bannedUntil,
        bannedUntil: normalized.bannedUntil,
      },
    });
  }

  // Pro shop inbox: require shopId + staff session
  if (shopId) {
    const gate = requireStaff(req, "pro");
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }
    const list = await getReservations({ shopId, status });
    const enriched = await Promise.all(
      list.map(async (r) => ({
        ...r,
        offer: await getOffer(r.offerId),
        shop: await getShop(r.shopId),
      }))
    );
    return NextResponse.json(
      { reservations: enriched },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // Client self-lookup: must filter by softUserId and/or phone (never dump all)
  if (!softUserId && !clientPhone) {
    return NextResponse.json(
      {
        error:
          "Filtre requis: softUserId, clientPhone ou shopId (Pro authentifié)",
      },
      { status: 400 }
    );
  }

  // Prefer softUserId; if both given, OR-merge carefully via two queries
  const list = await getReservations({
    softUserId,
    clientPhone: softUserId ? undefined : clientPhone,
    status,
  });
  if (softUserId && clientPhone) {
    const byPhone = await getReservations({ clientPhone, status });
    const seen = new Set(list.map((r) => r.id));
    for (const r of byPhone) {
      if (!seen.has(r.id)) list.push(r);
    }
    list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const enriched = await Promise.all(
    list.map(async (r) => ({
      ...r,
      offer: await getOffer(r.offerId),
      shop: await getShop(r.shopId),
    }))
  );
  return NextResponse.json({ reservations: enriched });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const softUserId =
    typeof body.softUserId === "string" ? body.softUserId : undefined;
  const clientNameRaw =
    typeof body.clientName === "string" ? body.clientName.trim() : "";
  const clientPhoneRaw =
    typeof body.clientPhone === "string" ? body.clientPhone.trim() : "";

  if (!clientNameRaw || clientNameRaw.length < 3) {
    return NextResponse.json(
      { error: "Le prénom doit contenir au moins 3 caractères." },
      { status: 400 }
    );
  }
  if (!clientPhoneRaw || !isValidSwissPhone(clientPhoneRaw)) {
    return NextResponse.json(
      {
        error:
          "Indique un numéro suisse valide (ex. 079 000 00 00).",
      },
      { status: 400 }
    );
  }

  const clientPhone = formatSwissPhoneDisplay(clientPhoneRaw);
  const clientName = clientNameRaw;

  // Client: always 1 lot / 1 réservation — ignore client-supplied qty
  const result = await createReservation({
    offerId: body.offerId,
    quantity: 1,
    clientName,
    clientPhone,
    softUserId,
    message: body.message,
    scanSessionId: body.scanSessionId,
  });
  if (!result.ok) {
    const status =
      result.error?.includes("Pause") ||
      result.error?.toLowerCase().includes("pause")
        ? 403
        : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  const offer = await getOffer(result.reservation.offerId);
  const e164 = toE164CH(clientPhone) || clientPhone;
  const sms = await sendReservationSms({
    to: e164,
    code: result.reservation.code,
    reservationId: result.reservation.id,
    offerTitle: offer?.title,
  });

  const strike = await getStrikeStatus({
    phone: result.reservation.clientPhone,
    softUserId: result.reservation.softUserId || softUserId,
  });
  return NextResponse.json(
    {
      reservation: result.reservation,
      offer,
      shop: await getShop(result.reservation.shopId),
      phoneRisk: strike.risk,
      strikeNote: strike.note,
      sms: {
        sent: sms.ok,
        stub: "stub" in sms ? sms.stub : false,
        provider: sms.provider,
        to: formatSwissPhoneDisplay(clientPhone),
        body: sms.body,
        error: sms.ok ? undefined : ("error" in sms ? sms.error : undefined),
      },
      notifications: {
        push: "[placeholder] Push: demande envoyée",
        email: "[placeholder] Email: confirmation de demande",
        sms: sms.body,
      },
    },
    { status: 201 }
  );
}
