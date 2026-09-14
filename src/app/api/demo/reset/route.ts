import { NextRequest, NextResponse } from "next/server";
import { resetDemo } from "@/lib/store";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const gatePro = requireStaff(req, "pro");
  const gateFounder = requireStaff(req, "fondateur");
  if (!gatePro.ok && !gateFounder.ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
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
