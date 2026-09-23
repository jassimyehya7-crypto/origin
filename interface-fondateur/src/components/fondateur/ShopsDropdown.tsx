"use client";

import { useState, useRef, useEffect } from "react";
import { Store, ChevronDown } from "lucide-react";

export type ShopStatus = "trial" | "active" | "unpaid";

export interface ShopListItem {
  id: string;
  name: string;
  status: ShopStatus;
}

const STATUS_COLORS: Record<ShopStatus, string> = {
  trial: "bg-ec-yellow",
  active: "bg-ec-green",
  unpaid: "bg-ec-red",
};

const STATUS_LABELS: Record<ShopStatus, string> = {
  trial: "1er mois offert",
  active: "Actif · payé",
  unpaid: "Impayé",
};

export function ShopsDropdown({ shops, published, total }: { shops: ShopListItem[]; published: number; total: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-2xl border border-ec-rule bg-white p-4 text-left shadow-sm transition hover:border-ec-muted"
      >
        <div>
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-ec-green" />
            <span className="text-[10px] font-extrabold uppercase text-ec-muted">
              Commerces
            </span>
          </div>
          <div className="mt-2 text-3xl font-black text-ec-ink">
            {published}
            <span className="text-base font-bold text-ec-muted">
              /{total}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-ec-muted">
            actifs / total
          </p>
        </div>
        <ChevronDown className={`h-5 w-5 text-ec-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-ec-rule bg-white py-2 shadow-lg">
          <div className="mb-2 flex items-center gap-3 border-b border-ec-rule px-4 pb-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-ec-muted">
              <span className="inline-block h-2 w-2 rounded-full bg-ec-yellow" />
              Essai
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-ec-muted">
              <span className="inline-block h-2 w-2 rounded-full bg-ec-green" />
              Actif
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-ec-muted">
              <span className="inline-block h-2 w-2 rounded-full bg-ec-red" />
              Impayé
            </span>
          </div>
          {shops.length === 0 ? (
            <p className="px-4 py-3 text-sm font-semibold text-ec-muted">
              Aucun commerce
            </p>
          ) : (
            shops.map((shop) => (
              <div
                key={shop.id}
                className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-ec-soft"
              >
                <span
                  className={`h-3 w-3 shrink-0 rounded-full ${STATUS_COLORS[shop.status]}`}
                  title={STATUS_LABELS[shop.status]}
                />
                <span className="flex-1 truncate text-sm font-bold text-ec-ink">
                  {shop.name}
                </span>
                <span className="text-[10px] font-bold text-ec-muted">
                  {STATUS_LABELS[shop.status]}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
