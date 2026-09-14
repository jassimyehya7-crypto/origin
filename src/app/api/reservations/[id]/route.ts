import { NextRequest, NextResponse } from "next/server";
import {
  getOffer,
  getReservation,
  getShop,
  updateReservationStatus,
} from "@/lib/store";
import { getStrikeStatus } from "@/lib/phone-risk";
import { sendReservationSms } from "@/lib/sms";
import { toE164CH } from "@/lib/phone";
import { requireStaff } from "@/lib/staff-auth";
import type { ReservationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED: ReservationStatus[] = [
  "EN_ATTENTE",
  "CONFIRMEE",
  "RECUPEREE",
  "REFUSEE",
  "ANNULEE",
  "NON_RECUPEREE",
  "EXPIREE",
];

/** Statuses a client may set without staff session. */
const CLIENT_ALLOWED: ReservationStatus[] = ["ANNULEE"];

/** Statuses that require Pro staff. */
const PRO_REQUIRED: ReservationStatus[] = [
  "CONFIRMEE",
  "RECUPEREE",
  "REFUSEE",
  "NON_RECUPEREE",
  "EXPIREE",
];

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reservation = await getReservation(params.id);
  if (!reservation)
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({
    reservation,
    offer: await getOffer(reservation.offerId),
    shop: await getShop(reservation.shopId),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const status = body.status as ReservationStatus;
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  if (PRO_REQUIRED.includes(status)) {
    const gate = requireStaff(req, "pro");
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }
  } else if (!CLIENT_ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const before = await getReservation(params.id);
  if (!before) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  // Client cancel only from EN_ATTENTE / CONFIRMEE + identity match
  if (status === "ANNULEE") {
    const staff = requireStaff(req, "pro");
    if (!staff.ok) {
      if (!["EN_ATTENTE", "CONFIRMEE"].includes(before.status)) {
        return NextResponse.json(
          { error: "Cette réservation ne peut plus être annulée" },
          { status: 400 }
        );
      }
      const softUserId =
        typeof body.softUserId === "string" ? body.softUserId.trim() : "";
      const clientPhone =
        typeof body.clientPhone === "string" ? body.clientPhone.trim() : "";
      const softOk =
        softUserId && before.softUserId && softUserId === before.softUserId;
      const phoneOk =
        clientPhone &&
        before.clientPhone &&
        clientPhone === before.clientPhone;
      if (!softOk && !phoneOk) {
        return NextResponse.json(
          { error: "Non autorisé à annuler cette réservation" },
          { status: 403 }
        );
      }
    }
  }

  const result = await updateReservationStatus(params.id, status);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  let sms:
    | Awaited<ReturnType<typeof sendReservationSms>>
    | undefined;
  if (status === "CONFIRMEE" && result.reservation.clientPhone) {
    const e164 =
      toE164CH(result.reservation.clientPhone) ||
      result.reservation.clientPhone;
    sms = await sendReservationSms({
      to: e164,
      code: result.reservation.code,
      reservationId: result.reservation.id,
      kind: "confirmee",
    });
  }

  const notifications =
    status === "CONFIRMEE"
      ? {
          push: `[placeholder] Push: réservation confirmée — code ${result.reservation.code}`,
          email: `[placeholder] Email: votre code ${result.reservation.code}`,
          sms: sms?.body,
          smsSent: sms?.ok === true && !("stub" in sms && sms.stub),
        }
      : status === "REFUSEE"
        ? {
            push: "[placeholder] Push: réservation refusée",
            email: "[placeholder] Email: réservation refusée",
          }
        : status === "ANNULEE"
          ? {
              push: "[placeholder] Push: réservation annulée",
              email: "[placeholder] Email: réservation annulée",
            }
          : undefined;

  const strike =
    status === "NON_RECUPEREE" || before?.status === "NON_RECUPEREE"
      ? await getStrikeStatus({
          phone: result.reservation.clientPhone,
          softUserId: result.reservation.softUserId,
        })
      : undefined;

  return NextResponse.json({
    reservation: result.reservation,
    offer: await getOffer(result.reservation.offerId),
    shop: await getShop(result.reservation.shopId),
    notifications,
    sms,
    strike,
  });
}
