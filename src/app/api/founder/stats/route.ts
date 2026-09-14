import { NextRequest, NextResponse } from "next/server";
import { getFounderStats } from "@/lib/store";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = requireStaff(req, "fondateur");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  return NextResponse.json(await getFounderStats());
}
