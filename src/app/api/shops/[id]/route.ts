import { NextRequest, NextResponse } from "next/server";
import { getShop, updateShop } from "@/lib/store";
import { requireStaff } from "@/lib/staff-auth";
import type { Shop } from "@/lib/types";

export const dynamic = "force-dynamic";

const OPEN_UNTIL_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

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
  const gate = requireStaff(req, "pro");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const body = await req.json().catch(() => ({}));
  const patch: Partial<Shop> = {};
  if (typeof body.openUntil === "string") {
    if (!OPEN_UNTIL_RE.test(body.openUntil)) {
      return NextResponse.json(
        { error: "Heure de fin invalide (HH:mm)" },
        { status: 400 }
      );
    }
    patch.openUntil = body.openUntil;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  }
  const shop = await updateShop(params.id, patch);
  if (!shop) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ shop });
}
