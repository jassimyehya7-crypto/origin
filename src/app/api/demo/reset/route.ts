import { NextResponse } from "next/server";
import { resetDemo } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const state = await resetDemo();
  return NextResponse.json({
    ok: true,
    message: "Démo réinitialisée",
    seededAt: state.seededAt,
    shops: state.shops.length,
    offers: state.offers.length,
    reservations: state.reservations.length,
  });
}
