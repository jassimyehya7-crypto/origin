import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

/** Ville par défaut si aucune géolocalisation n'est possible */
const DEFAULT_CITY = "Villeneuve";

export function LocationButton() {
  const [cityName, setCityName] = useState<string>("Localisation…");

  useEffect(() => {
    let cancelled = false;

    async function detectCity() {
      // Méthode 1: Géolocalisation GPS du téléphone (plus précis)
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
              // GPS réussi mais géocodage échoué → fallback IP
            }
            if (!cancelled) await fallbackToIP();
          },
          async () => {
            // Permission refusée ou erreur GPS → fallback IP
            if (!cancelled) await fallbackToIP();
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
        );
      } else {
        // Pas de support géolocalisation → fallback IP
        await fallbackToIP();
      }
    }

    // Méthode 2: Géolocalisation par IP (HTTPS uniquement)
    async function fallbackToIP() {
      if (cancelled) return;

      // Essayer ipapi.co (HTTPS, gratuit, 1000 req/jour)
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
        // ipapi.co échoué
      }

      // Essayer ipwho.is (HTTPS, gratuit, pas de clé)
      try {
        const res = await fetch("https://ipwho.is/", {
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
        // ipwho.is échoué
      }

      // Dernier recours : ville par défaut
      if (!cancelled) setCityName(DEFAULT_CITY);
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
