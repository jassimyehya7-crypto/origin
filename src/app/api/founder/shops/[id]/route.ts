import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";
import { getShop, updateShop } from "@/lib/store";
import type { Shop, TabletRequestStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const TABLET_STATUSES: TabletRequestStatus[] = [
  "none",
  "pending",
  "approved",
  "installed",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const gate = requireStaff(req, "fondateur");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const current = await getShop(params.id);
  if (!current) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const patch: Partial<Shop> = {};

  if (typeof body.subscriptionActive === "boolean") {
    patch.subscriptionActive = body.subscriptionActive;
  }

  if (typeof body.tabletRequestStatus === "string") {
    if (!TABLET_STATUSES.includes(body.tabletRequestStatus as TabletRequestStatus)) {
      return NextResponse.json(
        { error: "Statut tablette invalide" },
        { status: 400 }
      );
    }
    const nextStatus = body.tabletRequestStatus as TabletRequestStatus;
    patch.tabletRequestStatus = nextStatus;
    if (nextStatus === "installed") {
      patch.devicePlan = "tablette";
    }
    if (nextStatus === "none") {
      patch.devicePlan = "telephone";
      patch.tabletRequestedAt = undefined;
    }
    if (nextStatus === "pending" && !current.tabletRequestedAt) {
      patch.tabletRequestedAt = new Date().toISOString();
    }
    if (nextStatus === "approved" && current.tabletRequestStatus === "pending") {
      // keep requested_at
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  }

  const shop = await updateShop(params.id, patch);
  if (!shop) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({ shop });
}
