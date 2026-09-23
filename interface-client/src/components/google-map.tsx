import { useCallback, useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, TileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Lock, Minus, Plus } from "lucide-react";
import {
  inVilleneuve,
  MAP_CITIES,
  nearestLockedCity,
  VILLENEUVE_CENTER,
  type MapCity,
} from "@/lib/data/cities";
import { isMerchantOpen } from "@/lib/selectors";
import type { Merchant } from "@/lib/types";
import { cn } from "@/lib/utils";

const HYBRID =
  "https://mt{s}.google.com/vt/lyrs=y&hl=fr&gl=CH&scale=2&x={x}&y={y}&z={z}";
const ROAD =
  "https://mt{s}.google.com/vt/lyrs=m&hl=fr&gl=CH&scale=2&x={x}&y={y}&z={z}";

type Props = {
  merchants: Merchant[];
  now: Date;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onZoneChange: (unlocked: boolean, city: MapCity, zoom: number) => void;
  focusTick: number;
};

export function GoogleTownMap({ merchants, now, selectedId, onSelect, onZoneChange, focusTick }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const hybridRef = useRef<TileLayer | null>(null);
  const roadRef = useRef<TileLayer | null>(null);
  const merchantsLayer = useRef<LayerGroup | null>(null);
  const citiesLayer = useRef<LayerGroup | null>(null);
  const selectedRef = useRef(selectedId);
  const merchantsRef = useRef(merchants);
  const nowRef = useRef(now);
  const onSelectRef = useRef(onSelect);
  const onZoneRef = useRef(onZoneChange);
  const [mode, setMode] = useState<"hybrid" | "road">("hybrid");

  selectedRef.current = selectedId;
  merchantsRef.current = merchants;
  nowRef.current = now;
  onSelectRef.current = onSelect;
  onZoneRef.current = onZoneChange;

  const paintMerchants = useCallback(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    const layer = merchantsLayer.current;
    if (!map || !L || !layer) return;
    layer.clearLayers();
    if (map.getZoom() < 14) return;

    for (const merchant of merchantsRef.current) {
      const active = selectedRef.current === merchant.id;
      const open = isMerchantOpen(merchant, nowRef.current);
      const marker = L.marker([merchant.lat, merchant.lng], {
        title: merchant.name,
        icon: L.divIcon({
          className: "ol-shop-pin-wrap",
          html: `<span class="ol-shop-pin${active ? " is-active" : ""}${open ? "" : " is-closed"}">
            <img src="${merchant.banner}" alt="" />
          </span>`,
          iconSize: [34, 42],
          iconAnchor: [17, 42],
        }),
        zIndexOffset: active ? 800 : 500,
      });
      marker.on("click", () => onSelectRef.current(merchant.id));
      marker.addTo(layer);
    }
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || mapRef.current) return;
    let cancelled = false;
    let map: LeafletMap | null = null;
    let t = 0;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !hostRef.current) return;
      leafletRef.current = L;

      map = L.map(el, {
        zoomControl: false,
        attributionControl: true,
        minZoom: 7,
        maxZoom: 21,
        worldCopyJump: true,
        bounceAtZoomLimits: false,
      }).setView([VILLENEUVE_CENTER.lat, VILLENEUVE_CENTER.lng], 16);
      map.attributionControl.setPrefix(false);

      const hybrid = L.tileLayer(HYBRID, {
        subdomains: "0123",
        maxZoom: 21,
        maxNativeZoom: 21,
        updateWhenIdle: true,
        attribution: "&copy; Google",
      }).addTo(map);
      const road = L.tileLayer(ROAD, {
        subdomains: "0123",
        maxZoom: 21,
        maxNativeZoom: 21,
        attribution: "&copy; Google",
      });

      hybridRef.current = hybrid;
      roadRef.current = road;
      merchantsLayer.current = L.layerGroup().addTo(map);
      citiesLayer.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      const paintCities = () => {
        const layer = citiesLayer.current;
        if (!layer || !map) return;
        layer.clearLayers();
        const z = map.getZoom();
        const center = map.getCenter();
        const here = inVilleneuve(center.lat, center.lng);
        for (const city of MAP_CITIES) {
          if (here && z >= 14) continue;
          if (city.unlocked && z >= 14) continue;
          const html = city.unlocked
            ? `<div class="ol-city is-open"><span class="ol-city-name">${city.name}</span><span class="ol-city-sub">Ouvert</span></div>`
            : `<div class="ol-city"><span class="ol-city-name">${city.name}</span><span class="ol-city-sub">Bientôt disponible</span></div>`;
          const marker = L.marker([city.lat, city.lng], {
            icon: L.divIcon({
              className: "ol-city-wrap",
              html,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            }),
            zIndexOffset: city.unlocked ? 400 : 200,
          });
          marker.on("click", () => {
            map?.setView([city.lat, city.lng], city.unlocked ? 16 : 14);
          });
          marker.addTo(layer);
        }
      };

      const syncZone = () => {
        if (!map) return;
        const c = map.getCenter();
        const unlocked = inVilleneuve(c.lat, c.lng);
        onZoneRef.current(
          unlocked,
          unlocked ? MAP_CITIES[0] : nearestLockedCity(c.lat, c.lng),
          map.getZoom(),
        );
        paintCities();
        paintMerchants();
      };

      map.on("moveend", syncZone);
      map.on("zoomend", syncZone);
      map.whenReady(() => {
        map?.invalidateSize();
        syncZone();
      });
      t = window.setTimeout(() => map?.invalidateSize(), 80);
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      map?.remove();
      mapRef.current = null;
    };
  }, [paintMerchants]);

  useEffect(() => {
    paintMerchants();
  }, [merchants, now, selectedId, paintMerchants]);

  useEffect(() => {
    if (!focusTick) return;
    mapRef.current?.setView([VILLENEUVE_CENTER.lat, VILLENEUVE_CENTER.lng], 16);
  }, [focusTick]);

  function zoomBy(delta: number) {
    mapRef.current?.setZoom((mapRef.current.getZoom() ?? 16) + delta);
  }

  function recenter() {
    mapRef.current?.setView([VILLENEUVE_CENTER.lat, VILLENEUVE_CENTER.lng], 16);
  }

  function setTiles(next: "hybrid" | "road") {
    const map = mapRef.current;
    if (!map || !hybridRef.current || !roadRef.current) return;
    if (next === "hybrid") {
      map.removeLayer(roadRef.current);
      hybridRef.current.addTo(map);
    } else {
      map.removeLayer(hybridRef.current);
      roadRef.current.addTo(map);
    }
    setMode(next);
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div ref={hostRef} className="absolute inset-0 size-full" />
      <div className="pointer-events-none absolute right-3 top-[9.5rem] z-[500] flex flex-col gap-2">
        <button
          type="button"
          aria-label="Recentrer sur Villeneuve"
          onClick={recenter}
          className="pointer-events-auto grid size-10 place-items-center rounded-full bg-card shadow-[var(--shadow-float)] press"
        >
          <LocateFixed className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Zoomer"
          onClick={() => zoomBy(1)}
          className="pointer-events-auto grid size-10 place-items-center rounded-full bg-card shadow-[var(--shadow-float)] press"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Dézoomer"
          onClick={() => zoomBy(-1)}
          className="pointer-events-auto grid size-10 place-items-center rounded-full bg-card shadow-[var(--shadow-float)] press"
        >
          <Minus className="size-4" />
        </button>
      </div>
      <div className="absolute bottom-36 left-3 z-[500] flex overflow-hidden rounded-full bg-card text-xs font-semibold shadow-[var(--shadow-float)]">
        <button
          type="button"
          onClick={() => setTiles("hybrid")}
          className={cn("px-3 py-2 press", mode === "hybrid" ? "bg-lime text-ink" : "text-mute")}
        >
          Satellite
        </button>
        <button
          type="button"
          onClick={() => setTiles("road")}
          className={cn("px-3 py-2 press", mode === "road" ? "bg-lime text-ink" : "text-mute")}
        >
          Plan
        </button>
      </div>
    </div>
  );
}

export function LockedCityCard({
  city,
  onBack,
}: {
  city: MapCity;
  onBack: () => void;
}) {
  return (
    <div className="absolute inset-x-3 bottom-3 z-[500] rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-float)]">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-soft">
          <Lock className="size-4 text-mute" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold leading-tight">{city.name}</p>
          <p className="mt-0.5 text-sm text-mute">Bientôt disponible</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="mt-3 h-11 w-full rounded-full bg-lime text-sm font-semibold text-ink press"
      >
        Retour à Villeneuve
      </button>
    </div>
  );
}
