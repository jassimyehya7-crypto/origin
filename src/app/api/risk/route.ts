import { NextRequest, NextResponse } from "next/server";
import { getStrikeStatus, isPaused } from "@/lib/phone-risk";
import { normalizeRiskPayload } from "@/lib/risk-status";

export const dynamic = "force-dynamic";

/**
 * Client risk status — strikeCount, bannedUntil, message.
 * Identity: phone hash key and/or softUserId (same as phone-risk).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone =
    searchParams.get("phone") ||
    searchParams.get("riskPhone") ||
    "";
  const softUserId = searchParams.get("softUserId") || undefined;

  if (!phone && !softUserId) {
    return NextResponse.json(
      normalizeRiskPayload({ strikeCount: 0, banned: false })
    );
  }

  const status = await getStrikeStatus({ phone, softUserId });
  const pause = await isPaused({ phone, softUserId });

  return NextResponse.json(
    normalizeRiskPayload({
      strikes: status.strikes,
      strikeCount: status.strikes,
      noShows: status.noShows,
      paused: pause.paused,
      banned: pause.paused,
      pausedUntil: pause.until ?? status.pausedUntil,
      bannedUntil: pause.until ?? status.pausedUntil,
      note: status.note,
      message: pause.message || status.note,
      risk: status.risk,
    })
  );
}
