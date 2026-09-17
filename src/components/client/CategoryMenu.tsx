"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Beef,
  Gamepad2,
  Car,
  Plane,
  Utensils,
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
  { key: "espace_game", label: "Espace game", icon: Gamepad2 },
  { key: "restaurant", label: "Restaurant", icon: Utensils },
  { key: "agence_location", label: "Agence de location", icon: Car },
  { key: "agence_voyage", label: "Agence de voyage", icon: Plane },
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

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

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

      {open && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[#09152d]/55 px-0"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-menu-title"
          onClick={() => setOpen(false)}
        >
          <section
            className="w-full max-w-lg rounded-t-[24px] bg-white px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[#c1c6cf]" />
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 id="category-menu-title" className="text-[24px] font-black leading-tight text-[#09152d]">
                  Toutes les catégories
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#7d879b]">
                  Choisissez le commerce que vous recherchez
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ec-soft text-[#09152d]"
                aria-label="Fermer la liste des catégories"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid max-h-[62dvh] grid-cols-2 gap-3 overflow-y-auto pb-1">
              {CATEGORIES.map(({ key, label, icon: Icon }) => (
                <Link
                  key={key}
                  href={categoryHref(key, query)}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-[76px] items-center gap-3 rounded-[14px] border px-3 py-2 text-left active:scale-[0.98] ${
                    active === key
                      ? "border-ec-yellow bg-ec-yellow"
                      : "border-[#e3e6e1] bg-[#f7f8f5]"
                  }`}
                >
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                    <Icon className="h-6 w-6 stroke-[2.5]" />
                  </span>
                  <span className="min-w-0 text-[13px] font-black leading-tight text-[#09152d]">{label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}
