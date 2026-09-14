import { NextResponse } from "next/server";
import { clearStaffCookies } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  return clearStaffCookies(res);
}
