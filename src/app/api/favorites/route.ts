import { NextRequest, NextResponse } from "next/server";
import { getFavorites, getShop, toggleFavorite } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const list = await getFavorites();
  const favorites = await Promise.all(
    list.map(async (f) => ({
      ...f,
      shop: await getShop(f.shopId),
    }))
  );
  return NextResponse.json({ favorites });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.shopId)
    return NextResponse.json({ error: "shopId requis" }, { status: 400 });
  const favorited = await toggleFavorite(body.shopId);
  return NextResponse.json({ favorited, favorites: await getFavorites() });
}
