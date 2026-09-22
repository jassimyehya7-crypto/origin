import { useState, useEffect, useCallback } from "react";
import { MapPin, RefreshCw, X } from "lucide-react";
import { useAppStore } from "@/lib/store";

/** Coordonnées approximatives des villes suisses */
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "lausanne": { lat: 46.5197, lng: 6.6323 },
  "genève": { lat: 46.2044, lng: 6.1432 },
  "geneve": { lat: 46.2044, lng: 6.1432 },
  "berne": { lat: 46.9480, lng: 7.4474 },
  "bern": { lat: 46.9480, lng: 7.4474 },
  "zurich": { lat: 47.3769, lng: 8.5417 },
  "bâle": { lat: 47.5596, lng: 7.5886 },
  "bale": { lat: 47.5596, lng: 7.5886 },
  "lucerne": { lat: 47.0502, lng: 8.3093 },
  "fribourg": { lat: 46.8065, lng: 7.1619 },
  "neuchâtel": { lat: 46.9929, lng: 6.9319 },
  "neuchatel": { lat: 46.9929, lng: 6.9319 },
  "sion": { lat: 46.2330, lng: 7.3606 },
  "vevey": { lat: 46.4626, lng: 6.8414 },
  "montreux": { lat: 46.4312, lng: 6.9107 },
  "villeneuve": { lat: 46.3972, lng: 6.9265 },
  "yverdon": { lat: 46.7788, lng: 6.6412 },
  "nîmes": { lat: 43.8367, lng: 4.3601 },
  "nimes": { lat: 43.8367, lng: 4.3601 },
  "paris": { lat: 48.8566, lng: 2.3522 },
  "lyon": { lat: 45.7640, lng: 4.8357 },
  "marseille": { lat: 43.2965, lng: 5.3698 },
};

export function LocationButton() {
  const [cityName, setCityName] = useState<string>("Localisation…");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
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
            maximumAge: 0, // Force une nouvelle détection
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
      } catch (err) {
        console.log("[GPS] Échec:", err);
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

    // Échec total → proposer saisie manuelle
    setCityName("Clique pour saisir ta ville");
    setLoading(false);
  }, [setUserLocation]);

  // Détection automatique au montage
  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Saisie manuelle de la ville
  const handleManualCity = () => {
    const city = inputValue.trim().toLowerCase();
    if (!city) return;
    const coords = CITY_COORDS[city];
    if (coords) {
      setUserLocation(coords.lat, coords.lng);
      setCityName(inputValue.trim());
      setEditing(false);
      setInputValue("");
    } else {
      // Essayer de géocoder avec Nominatim
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputValue)}&limit=1`)
        .then((res) => res.json())
        .then((data) => {
          if (data.length > 0) {
            const { lat, lon, display_name } = data[0];
            setUserLocation(parseFloat(lat), parseFloat(lon));
            setCityName(display_name.split(",")[0]);
            setEditing(false);
            setInputValue("");
          } else {
            alert("Ville introuvable. Essaie avec un autre nom.");
          }
        })
        .catch(() => {
          alert("Erreur de géocodage. Réessaie.");
        });
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleManualCity()}
          placeholder="Ta ville (ex: Lausanne)"
          className="h-9 w-40 rounded-full bg-card px-3 text-sm shadow-[var(--shadow-card)] placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          autoFocus
        />
        <button
          type="button"
          onClick={handleManualCity}
          className="rounded-full bg-lime px-3 py-1.5 text-xs font-semibold text-ink press"
        >
          OK
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full p-1.5 hover:bg-soft press"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        // Si la détection auto a échoué → ouvrir la saisie manuelle
        if (cityName.includes("Clique") || cityName === "Position inconnue") {
          setEditing(true);
        } else {
          // Sinon → re-détecter
          detectLocation();
        }
      }}
      disabled={loading}
      className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink hover:bg-soft press disabled:opacity-50"
      title="Cliquer pour changer de ville"
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
