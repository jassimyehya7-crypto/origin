import { NextRequest, NextResponse } from "next/server";
import {
  setStaffCookies,
  staffSecretsConfigured,
  verifyPin,
  type StaffRole,
} from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  const role = (body.role === "fondateur" ? "fondateur" : "pro") as StaffRole;

  if (!staffSecretsConfigured()) {
    return NextResponse.json(
      { error: "Auth staff non configurée (EC_PRO_PIN / EC_FOUNDER_PIN)" },
      { status: 503 }
    );
  }
  if (!pin) {
    return NextResponse.json({ error: "Code requis" }, { status: 400 });
  }

  const shared = process.env.EC_STAFF_SECRET;
  const ok =
    verifyPin(role, pin) || Boolean(shared && pin === shared);

  if (!ok) {
    return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
  }

  const roles: StaffRole[] =
    shared && pin === shared ? ["pro", "fondateur"] : [role];

  const res = NextResponse.json({ ok: true, roles });
  return setStaffCookies(res, roles);
}
