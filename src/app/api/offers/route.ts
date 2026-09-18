import { NextRequest, NextResponse } from "next/server";
import { createOffer, getOffers, getShop } from "@/lib/store";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId") || undefined;
  const status = searchParams.get("status") || undefined;
  const publishedOnly = searchParams.get("published") === "1";
  const offers = await getOffers({ shopId, status, publishedOnly });
  const enriched = await Promise.all(
    offers.map(async (o) => ({
      ...o,
      shop: await getShop(o.shopId),
    }))
  );
  return NextResponse.json({ offers: enriched });
}

export async function POST(req: NextRequest) {
  const gate = requireStaff(req, "pro");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const body = await req.json();
  const timeLimited = body.limitMode === "time";
  const durationHours = Number(body.durationHours);
  const quantityTotal = timeLimited ? 0 : Number(body.quantityTotal);
  if (!body.shopId || !body.title?.trim() || !Number.isFinite(Number(body.price)) || Number(body.price) <= 0) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }
  const maxDuration = body.type === "FLASH" ? 24 : 72;
  if (timeLimited ? (!Number.isFinite(durationHours) || durationHours < 1 || durationHours > maxDuration) : !Number.isInteger(quantityTotal) || quantityTotal < 1) {
    return NextResponse.json({ error: timeLimited ? `Durée entre 1 et ${maxDuration} heures` : "Quantité valide (min. 1)" }, { status: 400 });
  }
  const offer = await createOffer({
    shopId: body.shopId,
    title: body.title,
    description: body.description || "",
    type: body.type || "PROMO",
    price: Number(body.price),
    originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
    quantityTotal,
    durationHours: timeLimited ? durationHours : undefined,
    unit: body.unit || "lot",
    emoji: body.emoji,
    imageUrl: body.imageUrl || undefined,
    publish: body.publish !== false,
  });
  return NextResponse.json({ offer }, { status: 201 });
}
