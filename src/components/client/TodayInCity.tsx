"use client";

import { useClientLocation } from "@/hooks/useClientLocation";

export function TodayInCity() {
  const { detectedCity } = useClientLocation();

  return (
    <p className="mb-3 text-center text-sm font-light italic tracking-wide text-ec-ink">
      Aujourd&apos;hui à {detectedCity}
    </p>
  );
}
