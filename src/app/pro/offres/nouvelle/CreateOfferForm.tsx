"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { OfferType } from "@/lib/types";
import { OFFER_TYPE_LABELS, OFFER_TYPE_DESCRIPTIONS } from "@/lib/labels";

export function CreateOfferForm({ defaultShopId }: { defaultShopId: string }) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [ambiguousWords, setAmbiguousWords] = useState<Array<{ original: string; suggestions: string[] }>>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "PROMO" as OfferType,
    price: "",
    quantityTotal: "5",
    limitMode: "quantity" as "quantity" | "time",
    durationHours: "3",
  });

  function flashToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("shopId", defaultShopId);
      const res = await fetch("/api/pro/offer-photo", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Échec de l'upload photo");
        return;
      }
      setImageUrl(data.url as string);
    } catch {
      setError("Impossible d'envoyer la photo");
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void uploadFile(file);
  }

  async function polishText() {
    if (!form.title.trim()) {
      setError("Saisis un titre avant d'améliorer le texte");
      return;
    }
    setPolishing(true);
    setError("");
    setSuggestions([]);
    setAmbiguousWords([]);
    try {
      const res = await fetch("/api/pro/polish-offer", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          type: form.type,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Amélioration impossible");
        return;
      }
      
      // Apply corrections automatically
      const nextTitle = typeof data.title === "string" && data.title.trim() ? data.title.trim() : form.title;
      const nextDesc = typeof data.description === "string" ? data.description : form.description;
      
      setForm((f) => ({
        ...f,
        title: nextTitle,
        description: nextDesc,
      }));
      
      // Show marketing suggestions if available
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }
      
      // Show ambiguous words if any
      if (Array.isArray(data.ambiguousWords) && data.ambiguousWords.length > 0) {
        setAmbiguousWords(data.ambiguousWords);
      }
      
      const hasChanges = nextTitle !== form.title.trim() || (nextDesc || "").trim() !== (form.description || "").trim();
      flashToast(hasChanges ? "Texte corrigé" : "Texte déjà clair");
    } catch {
      setError("Amélioration impossible");
    } finally {
      setPolishing(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Indique un prix avant de publier");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: defaultShopId,
          title: form.title,
          description: form.description,
          type: form.type,
          price,
          limitMode: form.limitMode,
          quantityTotal: form.limitMode === "quantity" ? Number(form.quantityTotal) : undefined,
          durationHours: form.limitMode === "time" ? Number(form.durationHours) : undefined,
          unit: "lot",
          imageUrl: imageUrl || undefined,
          publish: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      router.push("/pro/offres?toast=publiee");
      router.refresh();
    } catch {
      setError("Impossible de publier");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ec-ink px-4 py-2 text-sm font-extrabold text-white shadow-lg">
          {toast}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-extrabold text-ec-ink">
          Photo produit
        </label>
        <div className="relative mx-auto mb-3 flex aspect-square w-full max-w-[220px] items-center justify-center overflow-hidden rounded-2xl border border-ec-rule bg-ec-soft">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-contain p-2"
              sizes="220px"
              unoptimized
            />
          ) : (
            <span className="px-4 text-center text-sm font-semibold text-ec-muted">
              {uploading ? "Envoi…" : "Aucune photo"}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => cameraRef.current?.click()}
            className="h-12 flex-1 rounded-[12px] border border-ec-rule bg-ec-surface px-4 text-sm font-extrabold text-ec-ink disabled:opacity-50"
          >
            Photo
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => galleryRef.current?.click()}
            className="h-12 flex-1 rounded-[12px] border border-ec-rule bg-ec-surface px-4 text-sm font-extrabold text-ec-ink disabled:opacity-50"
          >
            Galerie
          </button>
          {imageUrl && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => setImageUrl(null)}
              className="h-12 rounded-[12px] border border-ec-rule bg-ec-soft px-4 text-sm font-bold text-ec-muted"
            >
              Retirer
            </button>
          )}
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileChange}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-extrabold text-ec-ink">
          Titre
        </label>
        <input
          required
          className="h-14 w-full rounded-[12px] border border-ec-rule bg-ec-surface px-4 text-base outline-none focus:ring-2 focus:ring-ec-blue"
          value={form.title}
          onChange={(e) => {
            setForm({ ...form, title: e.target.value });
            setSuggestions([]);
            setAmbiguousWords([]);
          }}
          placeholder="Ex. Mangues mûres à point"
        />
        <button
          type="button"
          onClick={() => void polishText()}
          disabled={polishing || !form.title.trim()}
          className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-[12px] border-2 border-ec-blue bg-ec-surface text-sm font-extrabold text-ec-blue disabled:border-ec-rule disabled:text-ec-muted"
        >
          {polishing ? "Analyse en cours…" : "Améliorer le texte"}
        </button>

        {/* Ambiguous words */}
        {ambiguousWords.length > 0 && (
          <div className="mt-3 rounded-xl border border-ec-red/30 bg-red-50 p-3">
            <p className="mb-2 text-xs font-extrabold text-ec-red">
              Mots à vérifier
            </p>
            {ambiguousWords.map((aw, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <p className="text-xs font-bold text-ec-ink">
                  <span className="line-through text-ec-muted">{aw.original}</span>
                  {" "}
                  <span className="text-ec-muted">→</span>
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {aw.suggestions.map((s, j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({
                          ...f,
                          title: f.title.replace(new RegExp(aw.original, "gi"), s),
                        }));
                        setAmbiguousWords((prev) => prev.filter((_, idx) => idx !== i));
                      }}
                      className="rounded-lg bg-white px-2 py-1 text-xs font-extrabold text-ec-blue shadow-sm transition hover:bg-ec-blue hover:text-white"
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmbiguousWords((prev) => prev.filter((_, idx) => idx !== i))}
                    className="rounded-lg bg-ec-soft px-2 py-1 text-xs font-bold text-ec-muted"
                  >
                    Garder
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Marketing suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-3 rounded-xl border border-ec-blue/30 bg-blue-50 p-3">
            <p className="mb-2 text-xs font-extrabold text-ec-blue">
              Suggestions marketing
            </p>
            <div className="space-y-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, title: s }));
                    setSuggestions([]);
                    flashToast("Titre mis à jour");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-left text-sm font-bold text-ec-ink shadow-sm transition hover:bg-ec-blue hover:text-white"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ec-blue text-[10px] font-black text-white">
                    {i + 1}
                  </span>
                  <span className="truncate">{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-extrabold text-ec-ink">
          Description{" "}
          <span className="font-semibold text-ec-muted">(optionnel)</span>
        </label>
        <textarea
          rows={3}
          className="w-full rounded-[12px] border border-ec-rule bg-ec-surface px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ec-blue"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Ex. Lot de 4, à récupérer avant 19h"
          maxLength={200}
        />
      </div>

      <div className={`grid gap-3 ${form.limitMode === "quantity" ? "grid-cols-2" : "grid-cols-1"}`}>
        <div>
          <label className="mb-1.5 block text-sm font-extrabold text-ec-ink">
            Prix (CHF)
          </label>
          <input
            required
            type="number"
            step="0.1"
            min="0.1"
            inputMode="decimal"
            className="h-14 w-full rounded-[12px] border border-ec-rule bg-ec-surface px-4 text-base outline-none focus:ring-2 focus:ring-ec-blue"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>
        {form.limitMode === "quantity" && <div>
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
        </div>}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-extrabold text-ec-ink">Limite de l&apos;offre</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["quantity", "time"] as const).map((mode) => (
            <button key={mode} type="button" onClick={() => setForm({ ...form, limitMode: mode })}
              aria-pressed={form.limitMode === mode}
              className={`min-h-12 rounded-[12px] border px-2 text-sm font-extrabold ${form.limitMode === mode ? "border-ec-ink bg-ec-ink text-white" : "border-ec-rule bg-ec-surface text-ec-ink"}`}>
              {mode === "quantity" ? "Nombre disponible" : "Durée de validité"}
            </button>
          ))}
        </div>
        {form.limitMode === "time" && <div className="mt-3">
          <label className="mb-1.5 block text-sm font-extrabold text-ec-ink">
            Durée (heures)
          </label>
          <input
            type="number"
            min="1"
            max={form.type === "FLASH" ? 24 : 72}
            inputMode="numeric"
            className="h-14 w-full rounded-[12px] border border-ec-rule bg-ec-surface px-4 text-base font-extrabold outline-none focus:ring-2 focus:ring-ec-blue"
            value={form.durationHours}
            onChange={(e) => {
              const max = form.type === "FLASH" ? 24 : 72;
              const val = Math.min(Number(e.target.value) || 0, max);
              setForm({ ...form, durationHours: String(val || e.target.value) });
            }}
            placeholder={form.type === "FLASH" ? "Max 24h" : "Ex. 5"}
          />
          <p className="mt-1.5 text-center text-[11px] font-semibold text-ec-muted">
            {form.type === "FLASH"
              ? "Max 24h. Le compte à rebours se met en pause à la fermeture et reprend à l'ouverture."
              : "Le compte à rebours se met en pause à la fermeture et reprend à l'ouverture du commerce."}
          </p>
        </div>}
      </fieldset>

      <div>
        <label className="mb-1.5 block text-sm font-extrabold text-ec-ink">
          Type d&apos;offre
        </label>
        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(OFFER_TYPE_LABELS) as OfferType[]).map((t) => {
            const selected = form.type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, type: t })}
                className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-all ${
                  selected
                    ? "border-ec-ink bg-ec-ink text-white shadow-sm"
                    : "border-ec-rule bg-white text-ec-ink hover:border-ec-muted"
                }`}
              >
                <span className="text-sm font-extrabold">{OFFER_TYPE_LABELS[t]}</span>
                <span className={`mt-0.5 text-[11px] font-semibold leading-snug ${selected ? "text-white/70" : "text-ec-muted"}`}>
                  {OFFER_TYPE_DESCRIPTIONS[t]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {form.limitMode === "quantity" && <p className="rounded-[12px] bg-ec-soft px-3 py-2 text-center text-xs font-semibold text-ec-muted">
        À la fermeture du commerce, l&apos;offre disparaît.
      </p>}

      {error && <p className="text-sm font-bold text-ec-red">{error}</p>}

      <Button
        type="submit"
        full
        variant="confirm"
        className="h-16 text-lg font-extrabold"
        disabled={loading || uploading}
      >
        {loading ? "Publication…" : "Publier"}
      </Button>
    </form>
  );
}
