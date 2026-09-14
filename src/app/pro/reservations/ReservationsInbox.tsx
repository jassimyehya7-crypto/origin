"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ReservationStatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  patchReservation,
  type InboxRow,
} from "@/components/pro/PendingInbox";
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
    return <Badge variant="muted">Sans téléphone</Badge>;
  }
  return (
    <a
      href={`tel:${phone.replace(/\s/g, "")}`}
      className="text-sm font-bold text-ec-blue"
    >
      {phone}
    </a>
  );
}

function OfferThumb({
  title,
  emoji,
  imageUrl,
}: {
  title?: string;
  emoji?: string;
  imageUrl?: string;
}) {
  const photo = title ? offerPhoto(title, imageUrl) : imageUrl;
  if (photo) {
    return (
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-ec-rule bg-ec-soft">
        <Image src={photo} alt="" fill className="object-cover" sizes="48px" />
      </div>
    );
  }
  return (
    <VisualMark label={title || "Offre"} stored={emoji} size="md" />
  );
}

function mergeRows(
  server: InboxRow[],
  overrides: Record<string, InboxRow["status"]>
): InboxRow[] {
  return server
    .map((r) => {
      const override = overrides[r.id];
      return override ? { ...r, status: override } : r;
    })
    .filter((r) => !(r.status === "EN_ATTENTE" && isPendingDismissed(r.id)));
}

export function ReservationsInbox({
  initial,
}: {
  initial: InboxRow[];
}) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<
    Record<string, InboxRow["status"]>
  >({});
  const [rows, setRows] = useState(() => mergeRows(initial, {}));
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "EN_ATTENTE" | "CONFIRMEE" | "done"
  >("EN_ATTENTE");

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
    const leavingPending =
      status === "CONFIRMEE" || status === "REFUSEE";
    if (leavingPending) dismissPendingId(id);
    setOverrides((o) => {
      const next = { ...o, [id]: status };
      setRows(mergeRows(initial, next));
      return next;
    });
    try {
      const data = await patchReservation(id, status);
      setOverrides((o) => {
        const next = { ...o, [id]: data.reservation.status };
        setRows(mergeRows(initial, next));
        return next;
      });
      if (status === "CONFIRMEE") {
        setToast(
          data.sms?.ok && !data.sms?.stub
            ? "Confirmée · SMS envoyé"
            : "Confirmée"
        );
      } else if (status === "REFUSEE") {
        setToast("Refusée");
      }
      router.refresh();
    } catch (e) {
      if (leavingPending) undismissPendingId(id);
      setOverrides((o) => {
        const n = { ...o };
        if (prevOverride) n[id] = prevOverride;
        else delete n[id];
        setRows(mergeRows(initial, n));
        return n;
      });
      setError(
        e instanceof Error
          ? e.message
          : "Impossible de mettre à jour. Réessayez."
      );
    } finally {
      setBusy(null);
    }
  }

  const filtered = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "done")
      return [
        "RECUPEREE",
        "REFUSEE",
        "ANNULEE",
        "NON_RECUPEREE",
        "EXPIREE",
      ].includes(r.status);
    return r.status === filter;
  });

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-[12px] border border-ec-red/30 bg-ec-paper px-3 py-2 text-sm font-bold text-ec-red">
          {error}
        </p>
      )}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {(
          [
            ["EN_ATTENTE", "À traiter"],
            ["CONFIRMEE", "Confirmées"],
            ["done", "Terminées"],
            ["all", "Toutes"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-extrabold ${
              filter === k
                ? "bg-ec-ink text-white"
                : "border border-ec-rule bg-ec-surface text-ec-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucune demande"
          description="Les nouvelles demandes apparaîtront ici."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="ec-corner-cut border border-ec-rule bg-ec-surface p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 gap-3">
                  <OfferThumb
                    title={r.offer?.title}
                    emoji={r.offer?.emoji}
                    imageUrl={r.offer?.imageUrl}
                  />
                  <div className="min-w-0">
                    <p className="font-extrabold text-ec-ink">{r.clientName}</p>
                    <div className="mt-0.5">
                      <PhoneLine phone={r.clientPhone} />
                    </div>
                    <p className="truncate text-sm font-semibold text-ec-muted">
                      {r.quantity}× {r.offer?.title} · {r.code}
                    </p>
                    <p className="text-[11px] font-semibold text-ec-muted">
                      {formatDateTime(r.createdAt)}
                      {r.message ? ` · « ${r.message} »` : ""}
                    </p>
                  </div>
                </div>
                <ReservationStatusBadge status={r.status} />
              </div>

              {r.status === "EN_ATTENTE" && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="confirm"
                    className="h-14 touch-manipulation text-base font-extrabold"
                    disabled={busy === r.id}
                    onClick={() => void act(r.id, "CONFIRMEE")}
                  >
                    {busy === r.id ? "…" : "Confirmer"}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="h-14 touch-manipulation text-base font-extrabold"
                    disabled={busy === r.id}
                    onClick={() => void act(r.id, "REFUSEE")}
                  >
                    {busy === r.id ? "…" : "Refuser"}
                  </Button>
                </div>
              )}
              {r.status === "CONFIRMEE" && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    className="h-14 touch-manipulation text-base font-extrabold"
                    disabled={busy === r.id}
                    onClick={() => void act(r.id, "RECUPEREE")}
                  >
                    {busy === r.id ? "…" : "Récupérée"}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="h-14 touch-manipulation text-base font-extrabold"
                    disabled={busy === r.id}
                    onClick={() => void act(r.id, "NON_RECUPEREE")}
                  >
                    {busy === r.id ? "…" : "Pas venue"}
                  </Button>
                </div>
              )}
              {r.status === "NON_RECUPEREE" && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full text-sm font-extrabold"
                    disabled={busy === r.id}
                    onClick={() => void act(r.id, "RECUPEREE")}
                  >
                    Corriger → Récupérée (retire strike)
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ec-ink px-4 py-2 text-sm font-extrabold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
