"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReservationStatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  patchReservation,
  type InboxRow,
} from "@/components/pro/PendingInbox";
import { hasClientPhone } from "@/lib/phone";
import { formatDateTime } from "@/lib/utils";

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

export function ReservationsInbox({
  initial,
}: {
  initial: InboxRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "EN_ATTENTE" | "CONFIRMEE" | "done">(
    "EN_ATTENTE"
  );

  async function act(id: string, status: InboxRow["status"]) {
    setBusy(id);
    try {
      const data = await patchReservation(id, status);
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data.reservation } : r))
      );
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  const filtered = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "done")
      return ["RECUPEREE", "REFUSEE", "ANNULEE", "NON_RECUPEREE", "EXPIREE"].includes(
        r.status
      );
    return r.status === filter;
  });

  return (
    <div>
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
          emoji="📥"
          title="Boîte vide"
          description="Les nouvelles demandes apparaîtront ici."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="rounded-[20px] border border-ec-rule bg-ec-surface p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] bg-ec-soft text-2xl">
                    {r.offer?.emoji || "🛍️"}
                  </div>
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
                    variant="confirm"
                    className="h-14 text-base font-extrabold"
                    disabled={busy === r.id}
                    onClick={() => act(r.id, "CONFIRMEE")}
                  >
                    Confirmer
                  </Button>
                  <Button
                    variant="danger"
                    className="h-14 text-base font-extrabold"
                    disabled={busy === r.id}
                    onClick={() => act(r.id, "REFUSEE")}
                  >
                    Refuser
                  </Button>
                </div>
              )}
              {r.status === "CONFIRMEE" && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    className="h-14 text-base font-extrabold"
                    disabled={busy === r.id}
                    onClick={() => act(r.id, "RECUPEREE")}
                  >
                    Récupérée
                  </Button>
                  <Button
                    variant="danger"
                    className="h-14 text-base font-extrabold"
                    disabled={busy === r.id}
                    onClick={() => act(r.id, "NON_RECUPEREE")}
                  >
                    Pas venue
                  </Button>
                </div>
              )}
              {r.status === "NON_RECUPEREE" && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="h-12 w-full text-sm font-extrabold"
                    disabled={busy === r.id}
                    onClick={() => act(r.id, "RECUPEREE")}
                  >
                    Corriger → Récupérée (retire strike)
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
