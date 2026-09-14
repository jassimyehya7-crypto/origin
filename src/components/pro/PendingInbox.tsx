"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReservationStatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { hasClientPhone } from "@/lib/phone";
import type { Offer, Reservation } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { VisualMark } from "@/components/VisualMark";

export type InboxRow = Reservation & { offer?: Offer };

export async function patchReservation(
  id: string,
  status: Reservation["status"]
) {
  const res = await fetch(`/api/reservations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erreur");
  return data as { reservation: Reservation };
}

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

export function PendingInbox({ items }: { items: InboxRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, status: Reservation["status"]) {
    setBusy(id);
    try {
      const data = await patchReservation(id, status);
      setRows((prev) =>
        prev
          .map((r) => (r.id === id ? { ...r, ...data.reservation } : r))
          .filter((r) => r.status === "EN_ATTENTE")
      );
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="ec-corner-cut border border-dashed border-ec-rule bg-ec-surface px-4 py-8 text-center text-sm font-semibold text-ec-muted">
        Aucune demande en attente
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div
          key={r.id}
          className="ec-corner-cut border border-ec-rule bg-ec-surface p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 gap-3">
              <VisualMark
                label={r.offer?.title || "Offre"}
                stored={r.offer?.emoji}
                size="md"
              />
              <div className="min-w-0">
                <p className="font-extrabold text-ec-ink">{r.clientName}</p>
                <div className="mt-0.5">
                  <PhoneLine phone={r.clientPhone} />
                </div>
                <p className="truncate text-sm font-semibold text-ec-muted">
                  {r.quantity}× {r.offer?.title}
                </p>
                <p className="text-[11px] font-semibold text-ec-muted">
                  {r.code} · {formatDateTime(r.createdAt)}
                  {r.message ? ` · « ${r.message} »` : ""}
                </p>
              </div>
            </div>
            <ReservationStatusBadge status={r.status} />
          </div>
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
        </div>
      ))}
    </div>
  );
}
