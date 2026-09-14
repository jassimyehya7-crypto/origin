import { NextRequest, NextResponse } from "next/server";
import { getShop, updateShop } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const shop = await getShop(params.id);
  if (!shop) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ shop });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const shop = await updateShop(params.id, body);
  if (!shop) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ shop });
}
