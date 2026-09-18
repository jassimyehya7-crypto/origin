"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteOfferButton({ id, onDeleted }: { id: string; onDeleted?: (id: string) => void }) {
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
      // Remove from list immediately
      onDeleted?.(id);
      // Silently refresh SSR — ignore AbortError in preview
      try { router.refresh(); } catch { /* noop */ }
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
        className="h-11 rounded-xl border border-ec-rule px-3 text-sm font-extrabold text-ec-red transition hover:bg-ec-red/5"
      >
        Supprimer
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
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
                className="h-14 rounded-xl bg-ec-red text-base font-extrabold text-white disabled:opacity-60 transition active:scale-[0.98]"
              >
                {busy ? "…" : "Oui, supprimer"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="h-12 rounded-xl border border-ec-rule text-sm font-extrabold text-ec-ink transition active:scale-[0.98]"
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
