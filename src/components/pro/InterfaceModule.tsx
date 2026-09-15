"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TabletRequestStatus } from "@/lib/types";

export function InterfaceModule({
  status,
}: {
  status: TabletRequestStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const installed = status === "installed";
  const pending = status === "pending" || status === "approved";

  async function requestTablet() {
    if (
      !confirm(
        "Demander une tablette installée (CHF 200.– une fois) ? Le fondateur recevra la demande."
      )
    ) {
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/pro/tablet-request", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error || `Erreur ${res.status}`
        );
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0 space-y-3 overflow-hidden">
      <h2 className="text-base font-extrabold text-ec-ink">Interface</h2>

      {installed ? (
        <div className="flex min-h-14 items-center justify-between gap-3 rounded-[12px] bg-ec-soft px-4 py-3">
          <span className="min-w-0 font-semibold text-ec-ink">Tablette</span>
          <strong className="shrink-0 text-ec-green">Tablette actif</strong>
        </div>
      ) : (
        <>
          <div className="flex min-h-14 items-center justify-between gap-3 rounded-[12px] bg-ec-soft px-4 py-3">
            <span className="min-w-0 font-semibold text-ec-ink">
              Téléphone
            </span>
            <strong className="shrink-0 text-ec-green">Gratuit</strong>
          </div>

          {pending ? (
            <div className="flex min-h-14 items-center justify-between gap-3 rounded-[12px] border-2 border-ec-rule bg-ec-paper px-4 py-3">
              <span className="min-w-0 font-semibold text-ec-ink">
                Tablette
              </span>
              <strong className="shrink-0 text-ec-muted">En attente</strong>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void requestTablet()}
              className="flex min-h-14 w-full min-w-0 items-center justify-between gap-3 rounded-[12px] border-2 border-ec-ink bg-ec-surface px-4 py-3 text-left transition active:scale-[0.99] disabled:opacity-60"
            >
              <span className="min-w-0">
                <span className="block font-extrabold text-ec-ink">
                  Tablette
                </span>
                <span className="block text-sm font-semibold text-ec-muted">
                  Option · CHF 200.– une fois
                </span>
              </span>
              <span className="shrink-0 text-sm font-extrabold text-ec-blue">
                {busy ? "…" : "Demander"}
              </span>
            </button>
          )}
        </>
      )}

      {err && <p className="text-sm font-bold text-ec-red">{err}</p>}
    </div>
  );
}
