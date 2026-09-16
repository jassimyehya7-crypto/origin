import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const gate = requireStaff(req, "pro");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (token.length < 40 || token.length > 100) {
    return NextResponse.json({ error: "QR invalide" }, { status: 400 });
  }
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Backend indisponible" }, { status: 503 });
  }
  const { data, error } = await supabase.rpc("ec_consume_pickup_token", {
    p_token: token,
  });
  if (error) {
    return NextResponse.json({ error: "Validation impossible" }, { status: 500 });
  }
  const consumed = Array.isArray(data) ? data[0] : null;
  if (!consumed) {
    return NextResponse.json(
      { error: "QR déjà utilisé, expiré ou non valide" },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true, pickup: consumed });
}
