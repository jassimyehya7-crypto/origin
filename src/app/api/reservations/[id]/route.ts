import { NextRequest, NextResponse } from "next/server";
import {
  getOffer,
  getReservation,
  getShop,
  updateReservationStatus,
} from "@/lib/store";
import { getStrikeStatus } from "@/lib/phone-risk";
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
  const before = await getReservation(params.id);
  const result = await updateReservationStatus(params.id, status);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const notifications =
    status === "CONFIRMEE"
      ? {
          push: `[placeholder] Push: réservation confirmée — code ${result.reservation.code}`,
          email: `[placeholder] Email: votre code ${result.reservation.code}`,
        }
      : status === "REFUSEE"
        ? {
            push: "[placeholder] Push: réservation refusée",
            email: "[placeholder] Email: réservation refusée",
          }
        : undefined;

  const strike =
    status === "NON_RECUPEREE" || before?.status === "NON_RECUPEREE"
      ? getStrikeStatus({
          phone: result.reservation.clientPhone,
          softUserId: result.reservation.softUserId,
        })
      : undefined;

  return NextResponse.json({
    reservation: result.reservation,
    offer: await getOffer(result.reservation.offerId),
    shop: await getShop(result.reservation.shopId),
    notifications,
    strike,
  });
}
