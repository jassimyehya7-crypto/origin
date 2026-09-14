import { NextRequest, NextResponse } from "next/server";
import { getShopBySlug, markScanBrowsed, recordScan } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const slug = body.shopSlug as string;
  if (!slug) return NextResponse.json({ error: "shopSlug requis" }, { status: 400 });
  const shop = await getShopBySlug(slug);
  if (!shop) return NextResponse.json({ error: "Commerce introuvable" }, { status: 404 });
  const scan = await recordScan(slug, body.sessionId);
  if (body.browsed && scan) {
    await markScanBrowsed(scan.sessionId, slug);
  }
  return NextResponse.json({ scan, shop });
}
