"use client";

import { ArrowRight, MapPin } from "lucide-react";
import { useClientLocation } from "@/hooks/useClientLocation";

/** Sticky header city + canton from GPS (fallback Villeneuve / VD). */
export function HeaderLocation() {
  const { detectedCity } = useClientLocation();

  return (
    <div className="flex items-center gap-2 text-[#09152d]">
      <MapPin className="h-7 w-7 fill-current" aria-hidden />
      <div className="max-w-[150px] leading-tight">
        <strong className="block text-sm">À {detectedCity}</strong>
        <span className="mt-0.5 block text-[11px] font-semibold text-[#91a0be]">Retrouvez nos offres<br />à Villeneuve à 2.3 km</span>
      </div>
      <ArrowRight className="h-6 w-6" />
    </div>
  );
}
