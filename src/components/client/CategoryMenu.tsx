"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Beef,
  CircleEllipsis,
  Croissant,
  Drumstick,
  Grid2X2,
  Milk,
  MoreHorizontal,
  Scissors,
  ShoppingBasket,
  Store,
  WashingMachine,
  X,
} from "lucide-react";
import type { ShopCategory } from "@/lib/types";

type CategoryKey = ShopCategory | "all";

const CATEGORIES: Array<{
  key: CategoryKey;
  label: string;
  icon: typeof Grid2X2;
}> = [
  { key: "all", label: "Tout", icon: Grid2X2 },
  { key: "epicerie", label: "Épicerie", icon: ShoppingBasket },
  { key: "boulangerie", label: "Boulangerie", icon: Croissant },
  { key: "kiosque", label: "Kiosque", icon: Store },
  { key: "coiffure", label: "Coiffure", icon: Scissors },
  { key: "cremiere", label: "Fromagerie", icon: Milk },
  { key: "boucherie", label: "Boucherie", icon: Beef },
  { key: "laverie", label: "Laverie", icon: WashingMachine },
  { key: "rotisserie", label: "Rôtisserie", icon: Drumstick },
  { key: "autre", label: "Autres", icon: CircleEllipsis },
];

const VISIBLE_KEYS: CategoryKey[] = [
  "all",
  "epicerie",
  "boulangerie",
  "kiosque",
  "coiffure",
];

function categoryHref(key: CategoryKey, query: string) {
  if (key === "all") return query ? `/?q=${encodeURIComponent(query)}` : "/";
  return `/?cat=${key}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
}

export function CategoryMenu({ active, query }: { active: CategoryKey; query: string }) {
  const [open, setOpen] = useState(false);
  const visible = CATEGORIES.filter((category) => VISIBLE_KEYS.includes(category.key));
  const hiddenActive = active !== "all" && !VISIBLE_KEYS.includes(active);

  return (
    <div className="relative">
      <div className="scrollbar-hide flex items-start justify-between gap-3 overflow-x-auto pb-0.5">
        {visible.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={categoryHref(key, query)}
            className="flex shrink-0 flex-col items-center gap-1"
            aria-label={label}
          >
            <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${active === key ? "bg-ec-yellow" : "bg-ec-soft"}`}>
              <Icon className="h-5 w-5 stroke-[2.6]" />
            </span>
          </Link>
        ))}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex shrink-0 flex-col items-center gap-1"
          aria-label={open ? "Fermer toutes les catégories" : "Voir toutes les catégories"}
          aria-expanded={open}
        >
          <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${open || hiddenActive ? "bg-ec-yellow" : "bg-ec-soft"}`}>
            {open ? <X className="h-5 w-5 stroke-[2.6]" /> : <MoreHorizontal className="h-5 w-5 stroke-[2.6]" />}
          </span>
        </button>
      </div>

      {open && (
        <div className="mt-3 rounded-[14px] border border-[#e3e6e1] bg-white p-3 shadow-[0_10px_28px_rgba(9,21,45,0.12)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[15px] font-black text-[#09152d]">Toutes les catégories</p>
            <button type="button" onClick={() => setOpen(false)} className="text-xs font-bold text-[#7a8378]">Fermer</button>
          </div>
          <div className="grid grid-cols-3 gap-x-2 gap-y-4">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <Link
                key={key}
                href={categoryHref(key, query)}
                className="flex min-w-0 flex-col items-center gap-1.5 text-center"
              >
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${active === key ? "bg-ec-yellow" : "bg-ec-soft"}`}>
                  <Icon className="h-5 w-5 stroke-[2.5]" />
                </span>
                <span className="w-full truncate text-[11px] font-bold text-[#09152d]">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
