"use client";

import { useClientLocation } from "@/hooks/useClientLocation";

export function TodayInCity() {
  const { detectedCity } = useClientLocation();

  return (
    <p className="mb-2 text-center text-[11px] font-medium text-ec-muted">
      Retrouvez nos offres à {detectedCity}
    </p>
  );
}
