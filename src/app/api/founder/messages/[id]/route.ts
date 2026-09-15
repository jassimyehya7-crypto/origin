import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";
import { updateFounderMessageStatus } from "@/lib/store";
import type { FounderMessageStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES: FounderMessageStatus[] = ["nouveau", "lu", "traite"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const gate = requireStaff(req, "fondateur");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const body = await req.json().catch(() => ({}));
  const status = body.status as string;
  if (!STATUSES.includes(status as FounderMessageStatus)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const message = await updateFounderMessageStatus(
    params.id,
    status as FounderMessageStatus
  );
  if (!message) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({ message });
}
