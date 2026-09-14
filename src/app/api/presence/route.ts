import { NextRequest, NextResponse } from "next/server";
import { getLiveClients, heartbeat } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ liveClients: await getLiveClients() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const count = await heartbeat(body.sessionId || "anon", body.page || "/");
  return NextResponse.json({ liveClients: count });
}
