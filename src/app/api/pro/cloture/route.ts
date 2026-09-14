import { NextRequest, NextResponse } from "next/server";
import { expireConfirmedRemaining } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const shopId =
    typeof body.shopId === "string" ? body.shopId : "shop_dasilva";
  const action = body.action || "expire_rest";
  if (action !== "expire_rest") {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }
  const count = await expireConfirmedRemaining(shopId);
  return NextResponse.json({ ok: true, expired: count });
}
