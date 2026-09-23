import { useState } from "react";
import {
  Beef,
  Car,
  Croissant,
  Drumstick,
  Gamepad2,
  Grid2x2,
  Milk,
  MoreHorizontal,
  Plane,
  Scissors,
  ShoppingBasket,
  Store,
  Utensils,
  WashingMachine,
} from "lucide-react";
import { CATEGORIES, VISIBLE_CATEGORY_IDS } from "@/lib/data/catalog";
import type { CategoryId } from "@/lib/types";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const ICONS: Record<CategoryId, typeof Grid2x2> = {
  all: Grid2x2,
  epicerie: ShoppingBasket,
  boulangerie: Croissant,
  kiosque: Store,
  cremiere: Milk,
  boucherie: Beef,
  coiffure: Scissors,
  laverie: WashingMachine,
  rotisserie: Drumstick,
  espace_game: Gamepad2,
  restaurant: Utensils,
  agence_location: Car,
  agence_voyage: Plane,
  autre: MoreHorizontal,
};

export function CategoryPills({
  value,
  onChange,
}: {
  value: CategoryId;
  onChange: (id: CategoryId) => void;
}) {
  const [open, setOpen] = useState(false);
  const visible = CATEGORIES.filter((c) => VISIBLE_CATEGORY_IDS.includes(c.id));
  const hiddenActive = value !== "all" && !VISIBLE_CATEGORY_IDS.includes(value);

  return (
    <>
      <div className="no-scrollbar -mx-5 flex items-start justify-between gap-3 overflow-x-auto px-5">
        {visible.map((cat) => {
          const Icon = ICONS[cat.id];
          const active = value === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(cat.id)}
              className="flex shrink-0 flex-col items-center gap-1.5 press"
              aria-label={cat.label}
            >
              <span
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-full",
                  active ? "bg-lime text-ink" : "bg-soft text-ink",
                )}
              >
                <Icon className="size-5" strokeWidth={2.4} />
              </span>
              <span className="text-[10px] font-semibold text-mute">{cat.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex shrink-0 flex-col items-center gap-1.5 press"
          aria-label="Toutes les catégories"
        >
          <span
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-full",
              open || hiddenActive ? "bg-lime text-ink" : "bg-soft text-ink",
            )}
          >
            <MoreHorizontal className="size-5" strokeWidth={2.4} />
          </span>
          <span className="text-[10px] font-semibold text-mute">Plus</span>
        </button>
      </div>
      <Sheet open={open} onOpenChange={setOpen} title="Toutes les catégories">
        <p className="mb-4 text-sm text-mute">Choisissez le commerce que vous recherchez.</p>
        <div className="grid max-h-[58dvh] grid-cols-2 gap-2 overflow-y-auto pb-2">
          {CATEGORIES.map((cat) => {
            const Icon = ICONS[cat.id];
            const active = value === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange(cat.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex min-h-[72px] items-center gap-3 rounded-[var(--radius-md)] border px-3 py-2 text-left press",
                  active ? "border-lime bg-lime" : "border-line bg-soft",
                )}
              >
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-card shadow-sm">
                  <Icon className="size-5" strokeWidth={2.4} />
                </span>
                <span className="min-w-0 text-[13px] font-bold leading-tight">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
