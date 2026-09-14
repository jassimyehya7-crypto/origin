"use client";

import { ArrowRight } from "lucide-react";
import { formatDistanceFr } from "@/lib/geo";
import { useClientLocation } from "@/hooks/useClientLocation";

/**
 * When the detected city has no shops, guide to the nearest covered city
 * with an arrow and distance (e.g. « Commerce le plus proche → Villeneuve · 1,2 km »).
 */
export function NearestCoverageBanner() {
  const { status, covered, nearestCity, nearestDistanceM } = useClientLocation();

  if (status === "loading") return null;
  if (covered || !nearestCity || nearestDistanceM == null) return null;

  return (
    <p className="mb-3 flex items-center justify-center gap-1.5 text-center text-sm text-ec-ink">
      <span className="font-medium">Commerce le plus proche</span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ec-blue" aria-hidden />
      <span className="font-bold">
        {nearestCity}
        <span className="font-semibold text-ec-muted">
          {" "}
          · {formatDistanceFr(nearestDistanceM)}
        </span>
      </span>
    </p>
  );
}
