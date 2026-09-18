"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import type { Offer } from "@/lib/types";

export function EditOfferButton({ offer, onUpdated }: { offer: Offer; onUpdated?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveOffer, setLiveOffer] = useState<Offer | null>(null);
  const [form, setForm] = useState({
    title: offer.title,
    price: String(offer.price),
    originalPrice: offer.originalPrice ? String(offer.originalPrice) : "",
    quantityTotal: String(offer.quantityTotal),
  });

  // Fetch live offer data when modal opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function fetchLive() {
      try {
        const res = await fetch(`/api/offers/${encodeURIComponent(offer.id)}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.offer) {
          setLiveOffer(data.offer);
        }
      } catch { /* silent */ }
    }

    fetchLive();
    const interval = setInterval(fetchLive, 5_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [open, offer.id]);

  function resetForm() {
    setForm({
      title: offer.title,
      price: String(offer.price),
      originalPrice: offer.originalPrice ? String(offer.originalPrice) : "",
      quantityTotal: String(offer.quantityTotal),
    });
    setError(null);
    setLiveOffer(null);
  }

  function closeModal() {
    setOpen(false);
    resetForm();
  }

  async function save() {
    setSaving(true);
    setError(null);
    const price = Number(form.price);
    const originalPrice = form.originalPrice ? Number(form.originalPrice) : undefined;
    const quantityTotal = Number(form.quantityTotal);

    if (!form.title.trim()) {
      setError("Le titre est requis");
      setSaving(false);
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError("Prix invalide");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/offers/${encodeURIComponent(offer.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          price,
          originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
          quantityTotal,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || "Modification impossible");
        return;
      }
      closeModal();
      onUpdated?.();
      try { router.refresh(); } catch { /* noop */ }
    } catch {
      setError("Modification impossible");
    } finally {
      setSaving(false);
    }
  }

  const current = liveOffer || offer;
  const isLive = current.status === "PUBLIEE";

  return (
    <>
      <button
        type="button"
        onClick={() => { resetForm(); setOpen(true); }}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-ec-rule px-2.5 text-xs font-bold text-ec-muted transition hover:border-ec-blue/30 hover:text-ec-blue"
      >
        <Pencil className="h-3 w-3" />
        Modifier
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ec-rule px-5 py-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-extrabold text-ec-ink">Modifier l&apos;offre</h3>
                {/* Live indicator */}
                <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                  isLive ? "bg-ec-green/15 text-ec-green" : "bg-ec-soft text-ec-muted"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${isLive ? "bg-ec-green animate-pulse" : "bg-ec-muted"}`} />
                  {isLive ? "En live" : "Hors ligne"}
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ec-muted transition hover:bg-ec-soft"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Live stock banner */}
            {isLive && (
              <div className="border-b border-ec-rule bg-ec-green/5 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-ec-green animate-pulse" />
                    <span className="text-xs font-bold text-ec-green">Stock en temps réel</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black tabular-nums text-ec-ink">{current.quantityLeft}</span>
                    <span className="text-xs font-semibold text-ec-muted">/ {current.quantityTotal} restants</span>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-extrabold text-ec-ink">Titre</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="h-12 w-full rounded-xl border border-ec-rule bg-white px-4 text-base font-semibold text-ec-ink outline-none focus:border-ec-blue focus:ring-1 focus:ring-ec-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-extrabold text-ec-ink">Prix (CHF)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    inputMode="decimal"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="h-12 w-full rounded-xl border border-ec-rule bg-white px-4 text-base font-semibold text-ec-ink outline-none focus:border-ec-blue focus:ring-1 focus:ring-ec-blue"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-extrabold text-ec-ink">
                    Prix barré <span className="font-semibold text-ec-muted">(optionnel)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    inputMode="decimal"
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    placeholder="Ex. 12.00"
                    className="h-12 w-full rounded-xl border border-ec-rule bg-white px-4 text-base font-semibold text-ec-ink outline-none focus:border-ec-blue focus:ring-1 focus:ring-ec-blue placeholder:text-ec-muted"
                  />
                </div>
              </div>

              {!offer.durationHours && (
                <div>
                  <label className="mb-1.5 block text-sm font-extrabold text-ec-ink">Quantité totale</label>
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={form.quantityTotal}
                    onChange={(e) => setForm({ ...form, quantityTotal: e.target.value })}
                    className="h-12 w-full rounded-xl border border-ec-rule bg-white px-4 text-base font-semibold text-ec-ink outline-none focus:border-ec-blue focus:ring-1 focus:ring-ec-blue"
                  />
                  {isLive && (
                    <p className="mt-1.5 text-[11px] font-semibold text-ec-muted">
                      {current.quantityLeft} encore disponibles sur {current.quantityTotal} au total
                    </p>
                  )}
                </div>
              )}

              {offer.durationHours && (
                <div className="rounded-xl bg-ec-soft px-4 py-3">
                  <p className="text-xs font-bold text-ec-muted">
                    ⏱️ Durée de validité : {offer.durationHours}h — non modifiable ici
                  </p>
                </div>
              )}

              {error && <p className="text-sm font-bold text-ec-red">{error}</p>}
            </div>

            {/* Footer */}
            <div className="border-t border-ec-rule px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex h-12 flex-1 items-center justify-center rounded-xl border border-ec-rule text-sm font-extrabold text-ec-ink transition active:scale-[0.98]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className="flex h-12 flex-1 items-center justify-center rounded-xl bg-ec-green text-sm font-extrabold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? "…" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
