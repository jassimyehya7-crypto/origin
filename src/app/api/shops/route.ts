import { NextResponse } from "next/server";
import { getShops } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ shops: await getShops() });
}
