"use client";

import { useEffect, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import Image from "next/image";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatWalkTime(km: number): string {
  const minutes = Math.round(km / 0.0833); // ~5 km/h walking speed
  if (minutes < 1) return "< 1 min à pied";
  if (minutes < 60) return `${minutes} min à pied`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? m.toString().padStart(2, "0") : "00"} à pied`;
}

export function DistanceWidget({
  shopLat,
  shopLng,
  shopName,
  shopCity,
  defaultDistance,
}: {
  shopLat: number;
  shopLng: number;
  shopName: string;
  shopCity: string;
  defaultDistance: string;
}) {
  const [distance, setDistance] = useState<string | null>(null);
  const [walkTime, setWalkTime] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = haversineKm(pos.coords.latitude, pos.coords.longitude, shopLat, shopLng);
        setDistance(km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`);
        setWalkTime(formatWalkTime(km));
        setLocating(false);
      },
      () => {
        setError(true);
        setLocating(false);
      },
      { timeout: 5000, maximumAge: 300000 }
    );
  }, [shopLat, shopLng]);

  const mapUrl = `https://maps.apple.com/?ll=${shopLat},${shopLng}&q=${encodeURIComponent(shopName)}`;
  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${shopLat},${shopLng}&zoom=15&size=600x200&markers=${shopLat},${shopLng},red-pushpin`;

  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-[5px] border border-[#dde1e8] bg-white shadow-sm"
    >
      <div className="relative h-[112px] w-full bg-[#e8ecf0]">
        <Image
          src={staticMapUrl}
          alt={`Carte de ${shopName}`}
          fill
          className="object-cover"
          sizes="(max-width: 512px) 100vw, 512px"
          unoptimized
        />
        {locating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <Navigation className="h-5 w-5 animate-pulse text-ec-blue" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-3 py-2.5">
        <div>
          <p className="text-[17px] font-black">
            <MapPin className="mr-1 inline h-4 w-4 text-ec-blue" />
            À {shopCity || "Villeneuve"}
          </p>
          <p className="text-[14px] font-semibold text-[#7f899f]">
            {distance && walkTime
              ? `${distance} · ${walkTime}`
              : defaultDistance}
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-ec-blue/10 px-3 py-1 text-xs font-extrabold text-ec-blue">
          Itinéraire →
        </span>
      </div>
    </a>
  );
}
