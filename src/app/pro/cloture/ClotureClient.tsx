"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReservationStatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  patchReservation,
  type InboxRow,
} from "@/components/pro/PendingInbox";
import { hasClientPhone } from "@/lib/phone";
import { formatDateTime } from "@/lib/utils";

export function ClotureClient({
  initial,
  shopId,
}: {
  initial: InboxRow[];
  shopId: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  async function act(id: string, status: InboxRow["status"]) {
    setBusy(id);
    try {
      const data = await patchReservation(id, status);
      setRows((prev) => prev.filter((r) => r.id !== id));
      void data;
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  async function closeRest() {
    if (
      !confirm(
        "Clôturer le reste en « Expirée » ? Stock rendu, aucun strike (pas de no-show)."
      )
    ) {
      return;
    }
    setClosing(true);
    try {
      const res = await fetch("/api/pro/cloture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, action: "expire_rest" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setRows([]);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <p className="rounded-[20px] border border-dashed border-ec-rule bg-ec-surface px-4 py-8 text-center text-sm font-semibold text-ec-muted">
          Aucune confirmée en attente de retrait
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
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
                      {hasClientPhone(r.clientPhone) ? (
                        <a
                          href={`tel:${r.clientPhone.replace(/\s/g, "")}`}
                          className="text-sm font-bold text-ec-blue"
                        >
                          {r.clientPhone}
                        </a>
                      ) : (
                        <Badge variant="muted">Sans téléphone</Badge>
                      )}
                    </div>
                    <p className="truncate text-sm font-semibold text-ec-muted">
                      {r.quantity}× {r.offer?.title} · {r.code}
                    </p>
                    <p className="text-[11px] font-semibold text-ec-muted">
                      {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                </div>
                <ReservationStatusBadge status={r.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button
                  variant="confirm"
                  className="h-16 text-base font-extrabold"
                  disabled={busy === r.id}
                  onClick={() => act(r.id, "RECUPEREE")}
                >
                  Récupérée
                </Button>
                <Button
                  variant="danger"
                  className="h-16 text-base font-extrabold"
                  disabled={busy === r.id}
                  onClick={() => act(r.id, "NON_RECUPEREE")}
                >
                  Pas venue
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <Button
          full
          variant="outline"
          className="h-14"
          disabled={closing}
          onClick={closeRest}
        >
          {closing ? "Clôture…" : "Clôturer le reste → Expirée"}
        </Button>
      )}
      <p className="text-center text-[11px] font-semibold text-ec-muted">
        « Pas venue » = no-show (strike). Ignorer / clôturer le reste = Expirée
        (0 strike).
      </p>
    </div>
  );
}
