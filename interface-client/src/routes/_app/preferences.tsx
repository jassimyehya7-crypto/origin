import { createFileRoute } from "@tanstack/react-router";
import {
  Beef,
  Croissant,
  Drumstick,
  Milk,
  Scissors,
  ShoppingBasket,
  Store,
  WashingMachine,
} from "lucide-react";
import { INTERESTS, RADIUS_KM } from "@/lib/data/catalog";
import type { InterestId } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/preferences")({
  component: Preferences,
});

const ICONS: Record<InterestId, typeof ShoppingBasket> = {
  epicerie: ShoppingBasket,
  boulangerie: Croissant,
  kiosque: Store,
  cremiere: Milk,
  boucherie: Beef,
  coiffure: Scissors,
  laverie: WashingMachine,
  rotisserie: Drumstick,
  espace_game: Store,
  restaurant: Store,
  agence_location: Store,
  agence_voyage: Store,
  autre: Store,
};

function Preferences() {
  const interests = useAppStore((s) => s.interests);
  const toggle = useAppStore((s) => s.toggleInterest);
  const radiusKm = useAppStore((s) => s.radiusKm);
  const setRadiusKm = useAppStore((s) => s.setRadiusKm);
  const idx = Math.max(0, RADIUS_KM.indexOf(radiusKm as (typeof RADIUS_KM)[number]));

  return (
    <div className="px-5 pb-8 pt-6 safe-top">
      <h1 className="font-display text-2xl font-bold tracking-tight">Préférences</h1>
      <p className="mt-1 text-sm text-mute">Pour composer un feed plus proche de vous.</p>

      <h2 className="mt-8 font-display text-lg font-semibold">Centres d’intérêt</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {INTERESTS.map((item) => {
          const Icon = ICONS[item.id];
          const on = interests.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full px-3.5 text-sm font-medium press",
                on ? "bg-lime text-ink" : "bg-card shadow-[var(--shadow-card)]",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold">Rayon de recherche</h2>
      <p className="mt-1 text-sm text-mute">Les offres au-delà de cette distance restent masquées.</p>
      <div className="mt-5">
        <input
          type="range"
          min={0}
          max={RADIUS_KM.length - 1}
          step={1}
          value={idx}
          onChange={(e) => setRadiusKm(RADIUS_KM[Number(e.target.value)] ?? 5)}
          className="w-full"
          aria-label="Rayon de recherche"
        />
        <div className="mt-2 flex justify-between text-xs font-medium text-mute">
          {RADIUS_KM.map((km) => (
            <span key={km} className={cn(km === radiusKm && "font-bold text-ink")}>
              {km} km
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
