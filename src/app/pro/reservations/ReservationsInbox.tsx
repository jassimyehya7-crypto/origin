"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, X, Package, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  fetchShopReservations,
  patchReservation,
  type InboxRow,
} from "@/components/pro/PendingInbox";
import { PRO_SHOP_ID } from "@/lib/pro-shop";
import { offerPhoto } from "@/lib/offer-photos";
import { hasClientPhone } from "@/lib/phone";
import {
  dismissPendingId,
  isPendingDismissed,
  undismissPendingId,
} from "@/lib/pro-dismissed";
import { formatDateTime } from "@/lib/utils";
import { VisualMark } from "@/components/VisualMark";

function PhoneLine({ phone }: { phone: string }) {
  if (!hasClientPhone(phone)) {
    return <span className="text-xs font-semibold text-ec-muted">Sans téléphone</span>;
  }
  return (
    <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-xs font-bold text-ec-blue hover:underline">
      {phone}
    </a>
  );
}

function OfferThumb({ title, emoji, imageUrl }: { title?: string; emoji?: string; imageUrl?: string }) {
  const photo = title ? offerPhoto(title, imageUrl) : imageUrl;
  if (photo) {
    return (
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ec-soft">
        <Image src={photo} alt="" fill className="object-cover" sizes="56px" />
      </div>
    );
  }
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-ec-soft">
      <VisualMark label={title || "Offre"} stored={emoji} size="md" />
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRMEE: "Confirmée",
  RECUPEREE: "Récupérée",
  REFUSEE: "Refusée",
  ANNULEE: "Annulée",
  NON_RECUPEREE: "Pas venu",
  EXPIREE: "Expirée",
};

const STATUS_COLORS: Record<string, string> = {
  EN_ATTENTE: "bg-ec-yellow/40 text-ec-ink",
  CONFIRMEE: "bg-ec-green/15 text-ec-green",
  RECUPEREE: "bg-ec-soft text-ec-muted",
  REFUSEE: "bg-ec-red/10 text-ec-red",
  ANNULEE: "bg-ec-soft text-ec-muted",
  NON_RECUPEREE: "bg-ec-red/10 text-ec-red",
  EXPIREE: "bg-ec-soft text-ec-muted",
};

function mergeRows(server: InboxRow[], overrides: Record<string, InboxRow["status"]>): InboxRow[] {
  return server
    .map((r) => {
      const override = overrides[r.id];
      return override ? { ...r, status: override } : r;
    })
    .filter((r) => !(r.status === "EN_ATTENTE" && isPendingDismissed(r.id)));
}

export function ReservationsInbox({ initial }: { initial: InboxRow[] }) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<string, InboxRow["status"]>>({});
  const [rows, setRows] = useState(() => mergeRows(initial, {}));
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "EN_ATTENTE" | "CONFIRMEE" | "done">("EN_ATTENTE");

  useEffect(() => {
    setOverrides((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const r of initial) {
        if (next[r.id] && r.status === next[r.id]) {
          delete next[r.id];
          changed = true;
        }
      }
      const merged = mergeRows(initial, changed ? next : prev);
      setRows(merged);
      return changed ? next : prev;
    });
  }, [initial]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  async function act(id: string, status: InboxRow["status"]) {
    setBusy(id);
    setError(null);
    const prevOverride = overrides[id];
    const snapshotRows = rows;
    const leavingPending = status === "CONFIRMEE" || status === "REFUSEE";
    if (leavingPending) dismissPendingId(id);
    setOverrides((o) => {
      const next = { ...o, [id]: status };
      setRows(mergeRows(initial, next));
      return next;
    });
    try {
      const data = await patchReservation(id, status);
      const fresh = await fetchShopReservations(PRO_SHOP_ID);
      setOverrides({});
      setRows(mergeRows(fresh, {}));
      if (status === "CONFIRMEE") {
        setToast(data.sms?.ok && !data.sms?.stub ? "Confirmée · SMS envoyé" : "Confirmée ✓");
      } else if (status === "REFUSEE") {
        setToast("Refusée");
      } else if (status === "RECUPEREE") {
        setToast("Récupérée ✓");
      }
      try { router.refresh(); } catch { /* noop */ }
    } catch (e) {
      if (leavingPending) undismissPendingId(id);
      setOverrides((o) => {
        const n = { ...o };
        if (prevOverride) n[id] = prevOverride;
        else delete n[id];
        setRows(snapshotRows.length ? snapshotRows : mergeRows(initial, n));
        return n;
      });
      setError(e instanceof Error ? e.message : "Impossible de mettre à jour.");
    } finally {
      setBusy(null);
    }
  }

  const filtered = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "done") return ["RECUPEREE", "REFUSEE", "ANNULEE", "NON_RECUPEREE", "EXPIREE"].includes(r.status);
    return r.status === filter;
  });

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-ec-red/30 bg-red-50 px-4 py-2.5">
          <AlertCircle className="h-4 w-4 text-ec-red" />
          <p className="text-sm font-bold text-ec-red">{error}</p>
        </div>
      )}

      {/* Filter pills */}
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {([
          ["EN_ATTENTE", "En attente"],
          ["CONFIRMEE", "Confirmées"],
          ["done", "Terminées"],
          ["all", "Toutes"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition-all ${
              filter === k ? "bg-ec-ink text-white shadow-sm" : "border border-ec-rule bg-white text-ec-muted hover:text-ec-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ec-rule bg-white px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ec-soft">
            <Package className="h-6 w-6 text-ec-muted" />
          </div>
          <p className="text-sm font-semibold text-ec-muted">Aucune réservation dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const borderAccent =
              r.status === "EN_ATTENTE" ? "border-l-ec-yellow" :
              r.status === "CONFIRMEE" ? "border-l-ec-green" :
              r.status === "RECUPEREE" ? "border-l-ec-green/40" :
              "border-l-ec-rule";

            return (
              <div
                key={r.id}
                className={`rounded-2xl border border-ec-rule border-l-4 ${borderAccent} bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <OfferThumb title={r.offer?.title} emoji={r.offer?.emoji} imageUrl={r.offer?.imageUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-base font-extrabold text-ec-ink">{r.clientName}</p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-ec-muted">
                          {r.quantity}× {r.offer?.title}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${STATUS_COLORS[r.status] || "bg-ec-soft text-ec-muted"}`}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-ec-muted">
                      <PhoneLine phone={r.clientPhone} />
                      <span>·</span>
                      <span>Code {r.code}</span>
                      <span>·</span>
                      <span>{formatDateTime(r.createdAt)}</span>
                    </div>
                    {r.message && (
                      <p className="mt-2 rounded-lg bg-ec-soft px-2.5 py-1.5 text-xs font-semibold text-ec-muted italic">
                        « {r.message} »
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                {r.status === "EN_ATTENTE" && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="flex h-12 items-center justify-center gap-2 rounded-xl bg-ec-green text-sm font-extrabold text-white shadow-sm transition-all hover:bg-ec-green/90 active:scale-[0.98] touch-manipulation disabled:opacity-50"
                      disabled={busy === r.id}
                      onClick={() => void act(r.id, "CONFIRMEE")}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                      {busy === r.id ? "…" : "Confirmer"}
                    </button>
                    <button
                      type="button"
                      className="flex h-12 items-center justify-center gap-2 rounded-xl border border-ec-rule bg-white text-sm font-extrabold text-ec-muted transition-all hover:border-ec-red/30 hover:text-ec-red active:scale-[0.98] touch-manipulation disabled:opacity-50"
                      disabled={busy === r.id}
                      onClick={() => void act(r.id, "REFUSEE")}
                    >
                      <X className="h-4 w-4" strokeWidth={3} />
                      {busy === r.id ? "…" : "Refuser"}
                    </button>
                  </div>
                )}
                {r.status === "CONFIRMEE" && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="flex h-12 items-center justify-center gap-2 rounded-xl bg-ec-green text-sm font-extrabold text-white shadow-sm transition-all hover:bg-ec-green/90 active:scale-[0.98] touch-manipulation disabled:opacity-50"
                      disabled={busy === r.id}
                      onClick={() => void act(r.id, "RECUPEREE")}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                      {busy === r.id ? "…" : "Récupérée"}
                    </button>
                    <button
                      type="button"
                      className="flex h-12 items-center justify-center gap-2 rounded-xl border border-ec-rule bg-white text-sm font-extrabold text-ec-muted transition-all hover:border-ec-red/30 hover:text-ec-red active:scale-[0.98] touch-manipulation disabled:opacity-50"
                      disabled={busy === r.id}
                      onClick={() => void act(r.id, "NON_RECUPEREE")}
                    >
                      <X className="h-4 w-4" strokeWidth={3} />
                      {busy === r.id ? "…" : "Pas venu"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-ec-ink px-5 py-3 text-sm font-extrabold text-white shadow-soft">
          {toast}
        </div>
      )}
    </div>
  );
}
