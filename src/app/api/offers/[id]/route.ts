import { NextRequest, NextResponse } from "next/server";
import {
  getOffer,
  getShop,
  incrementOfferViews,
  publishOffer,
  updateOffer,
} from "@/lib/store";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const offer = await getOffer(params.id);
  if (!offer) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const view = new URL(req.url).searchParams.get("view");
  if (view === "1") await incrementOfferViews(params.id);
  return NextResponse.json({
    offer: await getOffer(params.id),
    shop: await getShop(offer.shopId),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const gate = requireStaff(req, "pro");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const body = await req.json();
  if (body.action === "publish") {
    const offer = await publishOffer(params.id);
    if (!offer) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({ offer });
  }
  const offer = await updateOffer(params.id, body);
  if (!offer) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ offer });
}
