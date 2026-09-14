"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteOfferButton({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function confirmDelete() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/offers/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((data as { error?: string }).error || "Suppression impossible");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setErr("Suppression impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 rounded-[12px] border border-ec-rule px-3 text-sm font-extrabold text-ec-red"
      >
        Supprimer
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-[16px] bg-ec-surface p-5 shadow-xl">
            <h3 className="text-lg font-extrabold text-ec-ink">
              Supprimer cette offre ?
            </h3>
            <p className="mt-2 text-sm font-semibold text-ec-muted">
              Elle ne sera plus visible pour les clients.
            </p>
            {err && (
              <p className="mt-2 text-sm font-bold text-ec-red">{err}</p>
            )}
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmDelete()}
                className="h-14 rounded-[12px] bg-ec-red text-base font-extrabold text-white disabled:opacity-60"
              >
                {busy ? "…" : "Oui, supprimer"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="h-12 rounded-[12px] border border-ec-rule text-sm font-extrabold text-ec-ink"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
