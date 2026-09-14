"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  FALLBACK_CANTON,
  FALLBACK_CITY,
  FALLBACK_COORDS,
  pickCanton,
  pickCityName,
  resolveCoverage,
  type LatLng,
  type ShopGeo,
} from "@/lib/geo";

export type ClientLocationStatus = "loading" | "ready" | "denied";

export type ClientLocationValue = {
  status: ClientLocationStatus;
  /** Reverse-geocoded (or fallback) city shown in header / italic line. */
  detectedCity: string;
  canton: string;
  coords: LatLng;
  covered: boolean;
  /** City whose shops power the feed. */
  feedCity: string;
  nearestCity: string | null;
  nearestDistanceM: number | null;
  feedShopIds: Set<string>;
};

const ClientLocationContext = createContext<ClientLocationValue | null>(null);

function buildValue(
  status: ClientLocationStatus,
  city: string,
  canton: string,
  coords: LatLng,
  shops: ShopGeo[]
): ClientLocationValue {
  const coverage = resolveCoverage(city, coords, shops);
  return {
    status,
    detectedCity: city,
    canton,
    coords,
    covered: coverage.covered,
    feedCity: coverage.feedCity,
    nearestCity: coverage.covered
      ? null
      : coverage.nearestShop?.city ?? coverage.feedCity,
    nearestDistanceM: coverage.covered ? null : coverage.nearestDistanceM,
    feedShopIds: new Set(coverage.feedShopIds),
  };
}

async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{ city: string; canton: string }> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=12&addressdetails=1`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    return { city: FALLBACK_CITY, canton: FALLBACK_CANTON };
  }
  const data = (await res.json()) as {
    address?: Record<string, string | undefined>;
  };
  return {
    city: pickCityName(data.address),
    canton: pickCanton(data.address),
  };
}

export function ClientLocationProvider({
  shops,
  children,
}: {
  shops: ShopGeo[];
  children: ReactNode;
}) {
  const shopsFingerprint = useMemo(
    () => JSON.stringify(shops.map((s) => [s.id, s.city, s.lat, s.lng])),
    [shops]
  );

  const [value, setValue] = useState<ClientLocationValue>(() =>
    buildValue("loading", FALLBACK_CITY, FALLBACK_CANTON, FALLBACK_COORDS, shops)
  );

  useEffect(() => {
    let cancelled = false;
    const currentShops: ShopGeo[] = JSON.parse(shopsFingerprint).map(
      ([id, city, lat, lng]: [string, string, number, number]) => ({
        id,
        city,
        lat,
        lng,
      })
    );

    const apply = async (coords: LatLng, fromGps: boolean) => {
      let city = FALLBACK_CITY;
      let canton = FALLBACK_CANTON;
      if (fromGps) {
        try {
          const geo = await reverseGeocode(coords.lat, coords.lng);
          city = geo.city;
          canton = geo.canton;
        } catch {
          /* keep labels; still use real coords for distance */
        }
      }
      if (cancelled) return;
      setValue(
        buildValue(
          fromGps ? "ready" : "denied",
          city,
          canton,
          coords,
          currentShops
        )
      );
    };

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      void apply(FALLBACK_COORDS, false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void apply(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          true
        );
      },
      () => {
        void apply(FALLBACK_COORDS, false);
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 8_000 }
    );

    return () => {
      cancelled = true;
    };
  }, [shopsFingerprint]);

  return (
    <ClientLocationContext.Provider value={value}>
      {children}
    </ClientLocationContext.Provider>
  );
}

export function useClientLocation(): ClientLocationValue {
  const ctx = useContext(ClientLocationContext);
  if (!ctx) {
    return buildValue(
      "denied",
      FALLBACK_CITY,
      FALLBACK_CANTON,
      FALLBACK_COORDS,
      []
    );
  }
  return ctx;
}
