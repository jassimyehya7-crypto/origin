import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, RefreshCw, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { inVilleneuve, VILLENEUVE_CENTER } from "@/lib/data/cities";

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
  const [cityName, setCityName] = useState<string>("Villeneuve");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const requestId = useRef(0);
  const hydrated = useAppStore((s) => s.hydrated);
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const setManualCity = useAppStore((s) => s.setManualCity);

  const detectLocation = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);

    // La position IP n'est pas assez précise pour choisir une commune.
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0, // Force une nouvelle détection
          });
        });
        if (currentRequest !== requestId.current) return;
        const { latitude, longitude } = position.coords;
        if (position.coords.accuracy > 5000) {
          throw new Error("Position trop imprécise pour identifier une ville");
        }
        setUserLocation(latitude, longitude);
        setManualCity(null);
        if (inVilleneuve(latitude, longitude)) {
          setCityName("Villeneuve");
          setLoading(false);
          return;
        }
        // Reverse geocoding
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { "Accept-Language": "fr" } }
          );
          if (res.ok) {
            const data = await res.json();
            if (currentRequest !== requestId.current) return;
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality;
            if (city) {
              setCityName(city);
              setLoading(false);
              return;
            }
          }
        } catch { /* fallback */ }
        setCityName("Position actuelle");
        setLoading(false);
        return;
      } catch (err) {
        if (currentRequest !== requestId.current) return;
        console.log("[GPS] Échec:", err);
        // GPS refusé, indisponible ou imprécis : conserver le choix manuel.
      }
    }

    if (currentRequest !== requestId.current) return;
    if (!useAppStore.getState().manualCity) {
      setUserLocation(VILLENEUVE_CENTER.lat, VILLENEUVE_CENTER.lng);
      setCityName("Villeneuve");
    }
    setLoading(false);
  }, [setManualCity, setUserLocation]);

  // Le catalogue est centré sur Villeneuve. Le GPS ne démarre que sur demande.
  useEffect(() => {
    if (!hydrated) return;
    const savedCity = useAppStore.getState().manualCity;
    if (savedCity) {
      setCityName(savedCity);
    } else {
      setUserLocation(VILLENEUVE_CENTER.lat, VILLENEUVE_CENTER.lng);
      setCityName("Villeneuve");
    }
  }, [hydrated, setUserLocation]);

  // Saisie manuelle de la ville
  const handleManualCity = () => {
    const city = inputValue.trim().toLowerCase();
    if (!city) return;
    const currentRequest = ++requestId.current;
    setLoading(false);
    const coords = CITY_COORDS[city];
    if (coords) {
      setUserLocation(coords.lat, coords.lng);
      setManualCity(inputValue.trim());
      setCityName(inputValue.trim());
      setEditing(false);
      setInputValue("");
    } else {
      // Essayer de géocoder avec Nominatim
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputValue)}&limit=1`)
        .then((res) => res.json())
        .then((data) => {
          if (currentRequest !== requestId.current) return;
          if (data.length > 0) {
            const { lat, lon, display_name } = data[0];
            setUserLocation(parseFloat(lat), parseFloat(lon));
            setManualCity(display_name.split(",")[0]);
            setCityName(display_name.split(",")[0]);
            setEditing(false);
            setInputValue("");
          } else {
            alert("Ville introuvable. Essaie avec un autre nom.");
          }
        })
        .catch(() => {
          if (currentRequest !== requestId.current) return;
          alert("Erreur de géocodage. Réessaie.");
        });
    }
  };

  if (editing) {
    return (
      <div className="absolute inset-x-4 top-3 z-30 flex items-center gap-1 rounded-xl bg-paper p-1 shadow-[var(--shadow-card)] sm:left-auto sm:w-96">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleManualCity()}
          placeholder="Ta ville (ex: Lausanne)"
          className="h-9 min-w-0 flex-1 rounded-full bg-card px-3 text-sm placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
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
          onClick={() => {
            setEditing(false);
            detectLocation();
          }}
          className="rounded-full px-2 py-1.5 text-xs font-semibold text-ink hover:bg-soft press"
          title="Réessayer la position GPS"
        >
          Ma position
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
        setInputValue(cityName === "Position actuelle" ? "" : cityName);
        setEditing(true);
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
      <span>{loading ? "Localisation…" : cityName}</span>
    </button>
  );
}
