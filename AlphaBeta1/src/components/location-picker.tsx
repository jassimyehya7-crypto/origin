import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

export function LocationButton() {
  const [cityName, setCityName] = useState<string>("Localisation...");

  useEffect(() => {
    let cancelled = false;

    async function detectCity() {
      // Méthode 1: Géolocalisation GPS du téléphone
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            if (cancelled) return;
            const { latitude, longitude } = position.coords;
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                { headers: { "Accept-Language": "fr" } }
              );
              if (res.ok) {
                const data = await res.json();
                const city =
                  data.address?.city ||
                  data.address?.town ||
                  data.address?.village ||
                  data.address?.municipality ||
                  null;
                if (!cancelled && city) {
                  setCityName(city);
                  return;
                }
              }
            } catch {
              // fallback to IP
            }
            // Si GPS échoue, on essaie l'IP
            if (!cancelled) await fallbackToIP();
          },
          async () => {
            // Permission refusée ou erreur → fallback IP
            if (!cancelled) await fallbackToIP();
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
        );
      } else {
        // Pas de géolocalisation → fallback IP
        await fallbackToIP();
      }
    }

    // Méthode 2: Géolocalisation par IP (fonctionne toujours, sans permission)
    async function fallbackToIP() {
      if (cancelled) return;
      try {
        // Essayer ip-api.com (gratuit, pas de clé nécessaire)
        const res = await fetch("http://ip-api.com/json/?lang=fr", {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.city) {
            setCityName(data.city);
            return;
          }
        }
      } catch {
        // ip-api peut être bloqué en HTTPS, essayer ipapi.co
      }

      try {
        const res = await fetch("https://ipapi.co/json/", {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.city) {
            setCityName(data.city);
            return;
          }
        }
      } catch {
        // ignore
      }

      // Dernier recours
      if (!cancelled) setCityName("Villeneuve");
    }

    detectCity();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="inline-flex h-11 shrink-0 items-center gap-1.5 text-sm font-medium text-ink">
      <MapPin className="size-4 text-mute" />
      <span>{cityName}</span>
    </div>
  );
}
