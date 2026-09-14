"use client";

import { LocateFixed } from "lucide-react";
import { useClientLocation } from "@/hooks/useClientLocation";

/** Sticky header city + canton from GPS (fallback Villeneuve / VD). */
export function HeaderLocation() {
  const { detectedCity, canton } = useClientLocation();

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-ec-ink">
      <LocateFixed className="h-4 w-4 text-ec-blue" aria-hidden />
      <span className="leading-tight">
        {detectedCity}
        <span className="block text-[10px] font-semibold text-ec-muted">
          {canton}
        </span>
      </span>
    </div>
  );
}
