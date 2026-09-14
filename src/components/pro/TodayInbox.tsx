"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReservationStatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VisualMark } from "@/components/VisualMark";
import { PRO_COPY } from "@/lib/labels";
import { offerPhoto } from "@/lib/offer-photos";
import { hasClientPhone } from "@/lib/phone";
import {
  dismissPendingId,
  filterOutDismissed,
  isPendingDismissed,
  pruneDismissedAgainst,
  undismissPendingId,
} from "@/lib/pro-dismissed";
import { PRO_SHOP_ID } from "@/lib/pro-shop";
import type { Reservation } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import {
  fetchShopReservations,
  patchReservation,
  type InboxRow,
} from "./PendingInbox";

function PhoneLine({ phone }: { phone: string }) {
  if (!hasClientPhone(phone)) {
    return <Badge variant="muted">Sans téléphone</Badge>;
  }
  return (
    <a
      href={`tel:${phone.replace(/\s/g, "")}`}
      className="text-sm font-bold text-ec-blue"
      onClick={(e) => e.stopPropagation()}
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
      <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-ec-soft">
        <Image src={photo} alt="" fill className="object-cover" sizes="48px" />
      </div>
    );
  }
  return <VisualMark label={title || "Offre"} stored={emoji} size="md" />;
}

function pendingOnly(items: InboxRow[]): InboxRow[] {
  return filterOutDismissed(
    items.filter((r) => r.status === "EN_ATTENTE" && !isPendingDismissed(r.id))
  );
}

function confirmedOnly(items: InboxRow[]): InboxRow[] {
  return items.filter((r) => r.status === "CONFIRMEE");
}

function CardShell({
  r,
  children,
}: {
  r: InboxRow;
  children: React.ReactNode;
}) {
  return (
    <div className="ec-corner-cut border border-ec-rule bg-ec-surface p-4">
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
      {children}
    </div>
  );
}

type UndoToast = {
  id: string;
  label: string;
};

export function TodayInbox({
  items,
  dayClosed,
}: {
  items: InboxRow[];
  dayClosed?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(() => pendingOnly(items));
  const [pickup, setPickup] = useState(() => confirmedOnly(items));
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [undoToast, setUndoToast] = useState<UndoToast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissTick, setDismissTick] = useState(0);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const serverPendingIds = useMemo(
    () => items.filter((r) => r.status === "EN_ATTENTE").map((r) => r.id),
    [items]
  );

  useEffect(() => {
    pruneDismissedAgainst(serverPendingIds);
    setPending(pendingOnly(items));
    setPickup(confirmedOnly(items));
  }, [items, serverPendingIds, dismissTick]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  function clearUndoToast() {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setUndoToast(null);
  }

  function showUndoToast(id: string) {
    clearUndoToast();
    setUndoToast({ id, label: "Marqué pas venu" });
    undoTimerRef.current = setTimeout(() => {
      setUndoToast(null);
      undoTimerRef.current = null;
    }, 30_000);
  }

  async function applyFresh(fresh: InboxRow[]) {
    setPending(pendingOnly(fresh));
    setPickup(confirmedOnly(fresh));
  }

  async function undoPasVenu(id: string) {
    setBusy(id);
    setError(null);
    clearUndoToast();
    try {
      await patchReservation(id, "CONFIRMEE");
      const fresh = await fetchShopReservations(PRO_SHOP_ID);
      await applyFresh(fresh);
      setToast("Annulé · de retour à retirer");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Impossible d’annuler. Réessayez."
      );
    } finally {
      setBusy(null);
    }
  }

  async function act(id: string, status: Reservation["status"]) {
    setBusy(id);
    setError(null);
    const snapPending = pending;
    const snapPickup = pickup;
    const wasPending = pending.some((r) => r.id === id);

    if (wasPending) {
      dismissPendingId(id);
      setDismissTick((n) => n + 1);
      setPending((prev) => prev.filter((r) => r.id !== id));
    } else {
      setPickup((prev) => prev.filter((r) => r.id !== id));
    }

    try {
      const data = await patchReservation(id, status);
      const fresh = await fetchShopReservations(PRO_SHOP_ID);
      await applyFresh(fresh);
      if (status === "CONFIRMEE") {
        setToast(
          data.sms?.ok && !data.sms?.stub
            ? "Confirmée · SMS envoyé"
            : "Confirmée"
        );
      } else if (status === "REFUSEE") {
        setToast("Refusée");
      } else if (status === "RECUPEREE") {
        setToast("Récupérée");
      } else if (status === "NON_RECUPEREE") {
        showUndoToast(id);
      }
      router.refresh();
    } catch (e) {
      if (wasPending) {
        undismissPendingId(id);
        setDismissTick((n) => n + 1);
        setPending(snapPending.length ? snapPending : pendingOnly(items));
      } else {
        setPickup(snapPickup.length ? snapPickup : confirmedOnly(items));
      }
      setError(
        e instanceof Error
          ? e.message
          : "Impossible de mettre à jour. Réessayez."
      );
    } finally {
      setBusy(null);
    }
  }

  const total = pending.length + pickup.length;

  const toastNode = undoToast ? (
    <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ec-ink px-4 py-2 text-sm font-extrabold text-white shadow-soft">
      <span>{undoToast.label}</span>
      <button
        type="button"
        className="rounded-full bg-ec-yellow px-3 py-1 text-xs font-extrabold text-ec-ink touch-manipulation"
        disabled={busy === undoToast.id}
        onClick={() => void undoPasVenu(undoToast.id)}
      >
        Annuler
      </button>
    </div>
  ) : toast ? (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ec-ink px-4 py-2 text-sm font-extrabold text-white shadow-soft">
      {toast}
    </div>
  ) : null;

  if (total === 0) {
    return (
      <div>
        <p className="ec-corner-cut border border-dashed border-ec-rule bg-ec-surface px-4 py-8 text-center text-sm font-semibold text-ec-muted">
          {dayClosed ? PRO_COPY.dayEnded : PRO_COPY.emptyAll}
        </p>
        {!dayClosed && (
          <p className="mt-3 text-center text-sm font-semibold">
            <Link href="/pro/offres" className="text-ec-blue hover:underline">
              Voir les offres
            </Link>
          </p>
        )}
        {error && (
          <p className="mt-3 text-center text-sm font-bold text-ec-red">{error}</p>
        )}
        {toastNode}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dayClosed && (
        <p className="rounded-[12px] border border-ec-rule bg-ec-soft px-3 py-2 text-center text-sm font-bold text-ec-muted">
          {PRO_COPY.dayEnded}
        </p>
      )}
      {error && (
        <p className="rounded-[12px] border border-ec-red/30 bg-ec-paper px-3 py-2 text-sm font-bold text-ec-red">
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-3 text-sm font-extrabold text-ec-ink">
          À confirmer ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="ec-corner-cut border border-dashed border-ec-rule bg-ec-surface px-4 py-6 text-center text-sm font-semibold text-ec-muted">
            {PRO_COPY.emptyPending}
          </p>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <CardShell key={r.id} r={r}>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="confirm"
                    className="h-14 touch-manipulation px-2 text-sm font-extrabold leading-tight sm:text-base"
                    disabled={busy === r.id}
                    onClick={() => void act(r.id, "CONFIRMEE")}
                  >
                    {busy === r.id ? "…" : "Oui, c’est réservé"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-14 touch-manipulation px-2 text-sm font-extrabold leading-tight sm:text-base"
                    disabled={busy === r.id}
                    onClick={() => void act(r.id, "REFUSEE")}
                  >
                    {busy === r.id ? "…" : "Non, plus dispo"}
                  </Button>
                </div>
              </CardShell>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-extrabold text-ec-ink">
          {PRO_COPY.sectionPickup}
        </h2>
        {pickup.length === 0 ? (
          <p className="ec-corner-cut border border-dashed border-ec-rule bg-ec-surface px-4 py-6 text-center text-sm font-semibold text-ec-muted">
            {PRO_COPY.emptyPickup}
          </p>
        ) : (
          <div className="space-y-3">
            {pickup.map((r) => (
              <CardShell key={r.id} r={r}>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="confirm"
                    className="h-14 touch-manipulation px-2 text-sm font-extrabold leading-tight sm:text-base"
                    disabled={busy === r.id}
                    onClick={() => void act(r.id, "RECUPEREE")}
                  >
                    {busy === r.id ? "…" : "Récupérée"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-14 touch-manipulation px-2 text-sm font-extrabold leading-tight sm:text-base"
                    disabled={busy === r.id}
                    onClick={() => void act(r.id, "NON_RECUPEREE")}
                  >
                    {busy === r.id ? "…" : "Pas venu"}
                  </Button>
                </div>
              </CardShell>
            ))}
          </div>
        )}
      </section>

      {toastNode}
    </div>
  );
}
