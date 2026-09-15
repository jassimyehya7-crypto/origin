import { NextRequest, NextResponse } from "next/server";
import { PRO_SHOP_ID } from "@/lib/pro-shop";
import { requireStaff } from "@/lib/staff-auth";
import { getShop, updateShop } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const gate = requireStaff(req, "pro");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const shop = await getShop(PRO_SHOP_ID);
  if (!shop) {
    return NextResponse.json({ error: "Magasin introuvable" }, { status: 404 });
  }

  if (
    shop.tabletRequestStatus === "installed" ||
    shop.devicePlan === "tablette"
  ) {
    return NextResponse.json(
      { error: "Tablette déjà installée" },
      { status: 400 }
    );
  }

  if (
    shop.tabletRequestStatus === "pending" ||
    shop.tabletRequestStatus === "approved"
  ) {
    return NextResponse.json(
      { error: "Demande déjà en cours", shop },
      { status: 409 }
    );
  }

  const updated = await updateShop(PRO_SHOP_ID, {
    tabletRequestStatus: "pending",
    tabletRequestedAt: new Date().toISOString(),
  });

  return NextResponse.json({ shop: updated });
}
