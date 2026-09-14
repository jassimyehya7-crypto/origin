"use client";

import { useEffect, useState } from "react";

const FALLBACK_CITY = "Villeneuve";

function pickCity(payload: {
  address?: Record<string, string | undefined>;
}): string {
  const a = payload.address || {};
  return (
    a.city ||
    a.town ||
    a.village ||
    a.municipality ||
    a.city_district ||
    FALLBACK_CITY
  );
}

export function TodayInCity() {
  const [city, setCity] = useState(FALLBACK_CITY);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1`;
          const res = await fetch(url, {
            headers: { Accept: "application/json" },
          });
          if (!res.ok) return;
          const data = (await res.json()) as {
            address?: Record<string, string | undefined>;
          };
          const next = pickCity(data).trim();
          if (next) setCity(next);
        } catch {
          /* keep fallback */
        }
      },
      () => {
        /* permission denied / error → Villeneuve */
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 8_000 }
    );
  }, []);

  return (
    <p className="mb-3 text-center text-sm font-light italic tracking-wide text-ec-ink">
      Aujourd&apos;hui à {city}
    </p>
  );
}
