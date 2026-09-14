"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ReservationStatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { offerPhoto } from "@/lib/offer-photos";
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
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erreur");
  return data as {
    reservation: Reservation;
    sms?: { ok?: boolean };
  };
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

function OfferThumb({ title, emoji }: { title?: string; emoji?: string }) {
  const photo = title ? offerPhoto(title) : undefined;
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

export function PendingInbox({ items }: { items: InboxRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setRows(items);
  }, [items]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  async function act(id: string, status: Reservation["status"]) {
    setBusy(id);
    try {
      const data = await patchReservation(id, status);
      setRows((prev) =>
        prev
          .map((r) => (r.id === id ? { ...r, ...data.reservation } : r))
          .filter((r) => r.status === "EN_ATTENTE")
      );
      if (status === "CONFIRMEE" && data.sms?.ok) {
        setToast("SMS envoyé");
      }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return (
      <>
        <p className="ec-corner-cut border border-dashed border-ec-rule bg-ec-surface px-4 py-8 text-center text-sm font-semibold text-ec-muted">
          Aucune demande en attente
        </p>
        {toast && (
          <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ec-ink px-4 py-2 text-sm font-extrabold text-white shadow-lg">
            {toast}
          </div>
        )}
      </>
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
              <OfferThumb title={r.offer?.title} emoji={r.offer?.emoji} />
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
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ec-ink px-4 py-2 text-sm font-extrabold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
