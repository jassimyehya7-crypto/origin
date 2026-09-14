import { NextRequest, NextResponse } from "next/server";
import { expireConfirmedRemaining } from "@/lib/store";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const gate = requireStaff(req, "pro");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
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
