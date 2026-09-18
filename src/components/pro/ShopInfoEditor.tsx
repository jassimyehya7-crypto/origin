"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Phone, Package, Pencil, Check, X } from "lucide-react";
import { PRO_SHOP_ID } from "@/lib/pro-shop";
import type { Shop } from "@/lib/types";

export function ShopInfoEditor({
  shop,
  pickupsToday,
}: {
  shop: Shop;
  pickupsToday: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    address: shop.address || "",
    zip: shop.zip || "",
    city: shop.city || "",
    phone: shop.phone || "",
  });

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/shops/${encodeURIComponent(PRO_SHOP_ID)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || "Sauvegarde impossible");
        return;
      }
      setEditing(false);
      try { router.refresh(); } catch { /* noop */ }
    } catch {
      setError("Sauvegarde impossible");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-ec-muted">Adresse</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="h-11 w-full rounded-xl border border-ec-rule bg-white px-3 text-sm font-semibold text-ec-ink outline-none focus:border-ec-blue focus:ring-1 focus:ring-ec-blue"
          />
        </div>
        <div className="grid grid-cols-[80px_1fr] gap-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-ec-muted">NPA</label>
            <input
              type="text"
              value={form.zip}
              onChange={(e) => setForm({ ...form, zip: e.target.value })}
              className="h-11 w-full rounded-xl border border-ec-rule bg-white px-3 text-sm font-semibold text-ec-ink outline-none focus:border-ec-blue focus:ring-1 focus:ring-ec-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-ec-muted">Ville</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="h-11 w-full rounded-xl border border-ec-rule bg-white px-3 text-sm font-semibold text-ec-ink outline-none focus:border-ec-blue focus:ring-1 focus:ring-ec-blue"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-ec-muted">Téléphone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="h-11 w-full rounded-xl border border-ec-rule bg-white px-3 text-sm font-semibold text-ec-ink outline-none focus:border-ec-blue focus:ring-1 focus:ring-ec-blue"
          />
        </div>
        {error && <p className="text-xs font-bold text-ec-red">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-ec-green text-sm font-extrabold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            <Check className="h-4 w-4" strokeWidth={3} />
            {saving ? "…" : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setError(null);
              setForm({
                address: shop.address || "",
                zip: shop.zip || "",
                city: shop.city || "",
                phone: shop.phone || "",
              });
            }}
            disabled={saving}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-ec-rule px-4 text-sm font-extrabold text-ec-muted transition active:scale-[0.98]"
          >
            <X className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-stretch gap-4">
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-base font-bold text-ec-ink">{shop.address}</p>
        <p className="text-sm font-semibold text-ec-muted">
          {shop.zip} {shop.city}
        </p>
        <a
          href={`tel:${shop.phone}`}
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-ec-blue/10 px-3 py-1.5 text-sm font-extrabold text-ec-blue transition hover:bg-ec-blue/20"
        >
          <Phone className="h-3.5 w-3.5" />
          {shop.phone}
        </a>
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-ec-muted transition hover:bg-ec-soft hover:text-ec-ink"
          >
            <Pencil className="h-3 w-3" />
            Modifier les infos
          </button>
        </div>
      </div>
      <div className="flex w-28 shrink-0 flex-col items-center justify-center rounded-2xl bg-ec-soft px-3 py-4 text-center">
        <Package className="mb-1 h-4 w-4 text-ec-muted" />
        <strong className="text-3xl font-black tabular-nums text-ec-ink">
          {pickupsToday}
        </strong>
        <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-ec-muted">
          Retraits
        </span>
      </div>
    </div>
  );
}
