import { NextRequest, NextResponse } from "next/server";
import {
  createReservation,
  getOffer,
  getReservations,
  getShop,
} from "@/lib/store";
import { getStrikeStatus, isPaused } from "@/lib/phone-risk";
import { normalizeRiskPayload } from "@/lib/risk-status";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId") || undefined;
  const clientPhone = searchParams.get("clientPhone") || undefined;
  const riskPhone = searchParams.get("riskPhone");
  const softUserId = searchParams.get("softUserId") || undefined;
  if (riskPhone !== null && searchParams.has("riskPhone")) {
    const status = getStrikeStatus({
      phone: riskPhone || "",
      softUserId,
    });
    const pause = isPaused({ phone: riskPhone || "", softUserId });
    const normalized = normalizeRiskPayload({
      strikes: status.strikes,
      strikeCount: status.strikes,
      noShows: status.noShows,
      paused: pause.paused,
      banned: pause.paused,
      pausedUntil: pause.until ?? status.pausedUntil,
      bannedUntil: pause.until ?? status.pausedUntil,
      note: status.note,
      message: pause.message || status.note,
      risk: status.risk,
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
  const list = await getReservations({ shopId, clientPhone });
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
  const clientPhone =
    typeof body.clientPhone === "string" ? body.clientPhone : undefined;
  const softUserId =
    typeof body.softUserId === "string" ? body.softUserId : undefined;
  const clientName =
    typeof body.clientName === "string" ? body.clientName : undefined;
  const result = await createReservation({
    offerId: body.offerId,
    quantity: Number(body.quantity) || 1,
    clientName,
    clientPhone,
    softUserId,
    message: body.message,
    scanSessionId: body.scanSessionId,
  });
  if (!result.ok) {
    const status = result.error?.includes("Pause") ||
      result.error?.toLowerCase().includes("pause")
      ? 403
      : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  const strike = getStrikeStatus({
    phone: result.reservation.clientPhone,
    softUserId: result.reservation.softUserId || softUserId,
  });
  return NextResponse.json(
    {
      reservation: result.reservation,
      offer: await getOffer(result.reservation.offerId),
      shop: await getShop(result.reservation.shopId),
      phoneRisk: strike.risk,
      strikeNote: strike.note,
      notifications: {
        push: "[placeholder] Push: demande envoyée",
        email: "[placeholder] Email: confirmation de demande",
      },
    },
    { status: 201 }
  );
}
