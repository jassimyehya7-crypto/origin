"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { OfferType } from "@/lib/types";
import { OFFER_TYPE_LABELS } from "@/lib/labels";

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
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "PROMO" as OfferType,
    price: "",
    quantityTotal: "5",
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
    try {
      const prevTitle = form.title;
      const prevDesc = form.description;
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
      const nextTitle =
        typeof data.title === "string" && data.title.trim()
          ? data.title.trim()
          : prevTitle;
      const nextDesc =
        typeof data.description === "string"
          ? data.description
          : prevDesc;
      setForm((f) => ({
        ...f,
        title: nextTitle,
        description: nextDesc,
      }));
      const unchanged =
        nextTitle === prevTitle.trim() &&
        (nextDesc || "").trim() === (prevDesc || "").trim();
      flashToast(unchanged ? "Déjà clair" : "Texte amélioré");
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
          quantityTotal: Number(form.quantityTotal),
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
        <div className="relative mb-3 flex aspect-square w-full max-w-[220px] items-center justify-center overflow-hidden border border-ec-rule bg-ec-soft">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-cover"
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
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ex. Mangues mûres à point"
        />
        <button
          type="button"
          onClick={() => void polishText()}
          disabled={polishing || !form.title.trim()}
          className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-[12px] border-2 border-ec-blue bg-ec-surface text-sm font-extrabold text-ec-blue disabled:border-ec-rule disabled:text-ec-muted"
        >
          {polishing ? "Amélioration…" : "Améliorer le texte"}
        </button>
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

      <div className="grid grid-cols-2 gap-3">
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
              className={`min-h-12 rounded-[12px] border px-2 text-sm font-extrabold ${
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
