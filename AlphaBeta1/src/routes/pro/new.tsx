import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OFFER_TYPE_LABELS } from "@/lib/labels";
import { useAppStore } from "@/lib/store";
import type { OfferType } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pro/new")({
  component: ProNew,
});

const TYPES: OfferType[] = ["FLASH", "PROMO", "ARRIVAGE", "EXCLUSIVITE", "DERNIERE_MINUTE"];

function ProNew() {
  const createOffer = useAppStore((s) => s.createOffer);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("6.90");
  const [original, setOriginal] = useState("10.50");
  const [stock, setStock] = useState("8");
  const [unit, setUnit] = useState("panier");
  const [type, setType] = useState<OfferType>("PROMO");

  return (
    <form
      className="space-y-5 px-5 py-5"
      onSubmit={(e) => {
        e.preventDefault();
        const p = Number(price);
        const o = original ? Number(original) : undefined;
        const q = Math.max(1, Math.round(Number(stock)));
        if (!title.trim() || !Number.isFinite(p) || p <= 0) {
          toast("Complétez le titre et le prix");
          return;
        }
        const offer = createOffer({
          title: title.trim(),
          price: p,
          originalPrice: o && o > p ? o : undefined,
          stock: q,
          type,
          unit: unit.trim() || "pièce",
        });
        if (!offer) {
          toast("Impossible de publier");
          return;
        }
        toast("Offre publiée");
        void navigate({ to: "/pro/offers" });
      }}
    >
      <div>
        <h1 className="font-display text-2xl font-bold">Nouvelle offre</h1>
        <p className="mt-1 text-sm text-mute">Moins d’une minute · visible tout de suite côté client.</p>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-mute">Titre</span>
        <Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Panier fruits du jour" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-mute">Prix CHF</span>
          <Input className="mt-1.5" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-mute">Prix barré</span>
          <Input className="mt-1.5" inputMode="decimal" value={original} onChange={(e) => setOriginal(e.target.value)} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-mute">Stock</span>
          <Input className="mt-1.5" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-mute">Unité</span>
          <Input className="mt-1.5" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </label>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-mute">Type</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "h-10 rounded-full px-3.5 text-sm font-medium press",
                type === t ? "bg-lime text-ink" : "bg-card shadow-[var(--shadow-card)]",
              )}
            >
              {OFFER_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" size="lg">
        Publier l’offre
      </Button>
    </form>
  );
}
