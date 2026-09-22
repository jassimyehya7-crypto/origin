import { useState, useEffect, useCallback } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function LocationButton() {
  const [cityName, setCityName] = useState<string>("Localisation…");
  const [loading, setLoading] = useState(false);
  const setUserLocation = useAppStore((s) => s.setUserLocation);

  const detectLocation = useCallback(async () => {
    setLoading(true);
    setCityName("Localisation…");

    // Méthode 1: Géolocalisation GPS
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 300000,
          });
        });
        const { latitude, longitude } = position.coords;
        setUserLocation(latitude, longitude);
        // Reverse geocoding
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { "Accept-Language": "fr" } }
          );
          if (res.ok) {
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality;
            if (city) {
              setCityName(city);
              setLoading(false);
              return;
            }
          }
        } catch { /* fallback */ }
        setCityName(`${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);
        setLoading(false);
        return;
      } catch {
        // GPS refusé ou timeout → fallback IP
      }
    }

    // Méthode 2: Géolocalisation par IP
    try {
      const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        if (data.city) {
          setCityName(data.city);
          if (data.latitude && data.longitude) {
            setUserLocation(data.latitude, data.longitude);
          }
          setLoading(false);
          return;
        }
      }
    } catch { /* fallback */ }

    try {
      const res = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        if (data.city) {
          setCityName(data.city);
          if (data.latitude && data.longitude) {
            setUserLocation(data.latitude, data.longitude);
          }
          setLoading(false);
          return;
        }
      }
    } catch { /* fallback */ }

    setCityName("Position inconnue");
    setLoading(false);
  }, [setUserLocation]);

  // Détection automatique au montage
  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  return (
    <button
      type="button"
      onClick={detectLocation}
      disabled={loading}
      className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink hover:bg-soft press disabled:opacity-50"
      title="Cliquer pour re-détecter ma position"
    >
      {loading ? (
        <RefreshCw className="size-4 animate-spin text-mute" />
      ) : (
        <MapPin className="size-4 text-mute" />
      )}
      <span>{cityName}</span>
    </button>
  );
}
