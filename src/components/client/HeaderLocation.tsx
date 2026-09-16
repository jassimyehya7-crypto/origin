"use client";

import { ArrowRight, MapPin } from "lucide-react";
import { useClientLocation } from "@/hooks/useClientLocation";
import { formatDistanceFr } from "@/lib/geo";

/** Sticky header city + canton from GPS (fallback Villeneuve / VD). */
export function HeaderLocation() {
  const {
    status,
    detectedCity,
    canton,
    covered,
    feedCity,
    nearestDistanceM,
  } = useClientLocation();

  const title =
    status === "loading"
      ? "Localisation…"
      : `À ${detectedCity}${canton ? ` (${canton})` : ""}`;

  const subtitle =
    status === "loading"
      ? "Recherche des offres proches"
      : covered
        ? `Retrouvez nos offres à ${feedCity}`
        : nearestDistanceM != null
          ? `Le plus proche : ${feedCity} · ${formatDistanceFr(nearestDistanceM)}`
          : `Retrouvez nos offres à ${feedCity}`;

  return (
    <div className="flex items-center gap-2 text-[#09152d]">
      <MapPin className="h-7 w-7 fill-current" aria-hidden />
      <div className="max-w-[150px] leading-tight">
        <strong className="block truncate text-sm">{title}</strong>
        <span className="mt-0.5 block text-[11px] font-semibold leading-tight text-[#91a0be]">
          {subtitle}
        </span>
      </div>
      <ArrowRight className="h-6 w-6" />
    </div>
  );
}
