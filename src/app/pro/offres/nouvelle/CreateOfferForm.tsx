"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { OfferType } from "@/lib/types";
import { OFFER_TYPE_LABELS } from "@/lib/labels";

export function CreateOfferForm({ defaultShopId }: { defaultShopId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    type: "PROMO" as OfferType,
    price: "",
    quantityTotal: "5",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: defaultShopId,
          title: form.title,
          type: form.type,
          price: Number(form.price),
          quantityTotal: Number(form.quantityTotal),
          unit: "lot",
          publish: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      router.push("/pro");
      router.refresh();
    } catch {
      setError("Impossible de publier");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-extrabold text-ec-ink">
          Titre
        </label>
        <input
          required
          className="h-14 w-full rounded-[12px] border border-ec-rule bg-ec-surface px-4 text-base outline-none focus:ring-2 focus:ring-ec-blue"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ex. Mangues mûres à point"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-extrabold text-ec-ink">
            Prix (CHF)
          </label>
          <input
            required
            type="number"
            step="0.1"
            min="0"
            inputMode="decimal"
            className="h-14 w-full rounded-[12px] border border-ec-rule bg-ec-surface px-4 text-base outline-none focus:ring-2 focus:ring-ec-blue"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-extrabold text-ec-ink">
            Quantité
          </label>
          <input
            required
            type="number"
            min="1"
            inputMode="numeric"
            className="h-14 w-full rounded-[12px] border border-ec-rule bg-ec-surface px-4 text-base outline-none focus:ring-2 focus:ring-ec-blue"
            value={form.quantityTotal}
            onChange={(e) =>
              setForm({ ...form, quantityTotal: e.target.value })
            }
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-extrabold text-ec-ink">
          Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(OFFER_TYPE_LABELS) as OfferType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm({ ...form, type: t })}
              className={`h-12 rounded-[12px] border text-sm font-extrabold ${
                form.type === t
                  ? "border-ec-ink bg-ec-ink text-white"
                  : "border-ec-rule bg-ec-surface text-ec-ink"
              }`}
            >
              {OFFER_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <p className="rounded-[12px] bg-ec-soft px-3 py-2 text-xs font-semibold text-ec-muted">
        Valable jusqu&apos;à la fermeture — fin de journée (défaut).
      </p>

      {error && <p className="text-sm font-bold text-ec-red">{error}</p>}

      <Button type="submit" full className="h-14 text-base font-extrabold" disabled={loading}>
        {loading ? "Publication…" : "Publier"}
      </Button>
    </form>
  );
}
