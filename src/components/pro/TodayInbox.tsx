"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, Package, UserCircle, AlertCircle } from "lucide-react";
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
    return <span className="text-xs font-semibold text-ec-muted">Sans téléphone</span>;
  }
  return (
    <a
      href={`tel:${phone.replace(/\s/g, "")}`}
      className="text-xs font-bold text-ec-blue hover:underline"
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

function pendingOnly(items: InboxRow[]): InboxRow[] {
  return filterOutDismissed(
    items.filter((r) => r.status === "EN_ATTENTE" && !isPendingDismissed(r.id))
  );
}

function confirmedOnly(items: InboxRow[]): InboxRow[] {
  return items.filter((r) => r.status === "CONFIRMEE");
}

function ReservationCard({
  r,
  children,
  variant,
}: {
  r: InboxRow;
  children: React.ReactNode;
  variant: "pending" | "pickup";
}) {
  const accent = variant === "pending" ? "border-l-ec-yellow" : "border-l-ec-green";
  return (
    <div className={`rounded-2xl border border-ec-rule border-l-4 ${accent} bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <OfferThumb
          title={r.offer?.title}
          emoji={r.offer?.emoji}
          imageUrl={r.offer?.imageUrl}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base font-extrabold text-ec-ink">{r.clientName}</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-ec-muted">
                {r.quantity}× {r.offer?.title}
              </p>
            </div>
            <Badge
              variant={variant === "pending" ? "warning" : "success"}
              className="shrink-0"
            >
              {variant === "pending" ? "Nouvelle demande" : "Confirmée"}
            </Badge>
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
      <div className="mt-4">{children}</div>
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
      setToast("Annulé · de retour à préparer");
      // router.refresh() can throw AbortError in preview — silently ignore
      try { router.refresh(); } catch { /* noop */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'annuler. Réessayez.");
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
          data.sms?.ok && !data.sms?.stub ? "Confirmée · SMS envoyé" : "Confirmée ✓"
        );
      } else if (status === "REFUSEE") {
        setToast("Refusée");
      } else if (status === "RECUPEREE") {
        setToast("Récupérée ✓");
      } else if (status === "NON_RECUPEREE") {
        showUndoToast(id);
      }
      // router.refresh() can throw AbortError in preview — silently ignore
      try { router.refresh(); } catch { /* noop */ }
    } catch (e) {
      if (wasPending) {
        undismissPendingId(id);
        setDismissTick((n) => n + 1);
        setPending(snapPending.length ? snapPending : pendingOnly(items));
      } else {
        setPickup(snapPickup.length ? snapPickup : confirmedOnly(items));
      }
      setError(e instanceof Error ? e.message : "Impossible de mettre à jour. Réessayez.");
    } finally {
      setBusy(null);
    }
  }

  const total = pending.length + pickup.length;

  const toastNode = undoToast ? (
    <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-ec-ink px-5 py-3 text-sm font-extrabold text-white shadow-soft">
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
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-ec-ink px-5 py-3 text-sm font-extrabold text-white shadow-soft">
      {toast}
    </div>
  ) : null;

  if (total === 0) {
    return (
      <div>
        <div className="rounded-2xl border border-dashed border-ec-rule bg-white px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ec-soft">
            <Package className="h-6 w-6 text-ec-muted" />
          </div>
          <p className="text-sm font-semibold text-ec-muted">
            {dayClosed ? PRO_COPY.dayEnded : PRO_COPY.emptyAll}
          </p>
          {!dayClosed && (
            <Link
              href="/pro/offres"
              className="mt-3 inline-block text-sm font-bold text-ec-blue hover:underline"
            >
              Voir les offres →
            </Link>
          )}
        </div>
        {error && (
          <p className="mt-3 text-center text-sm font-bold text-ec-red">{error}</p>
        )}
        {toastNode}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {dayClosed && (
        <div className="flex items-center gap-2 rounded-xl bg-ec-soft px-4 py-2.5">
          <AlertCircle className="h-4 w-4 text-ec-muted" />
          <p className="text-sm font-bold text-ec-muted">{PRO_COPY.dayEnded}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-ec-red/30 bg-red-50 px-4 py-2.5">
          <AlertCircle className="h-4 w-4 text-ec-red" />
          <p className="text-sm font-bold text-ec-red">{error}</p>
        </div>
      )}

      {/* Pending section */}
      <section>
        <div className="mb-1 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-ec-yellow" />
          <h2 className="text-sm font-extrabold text-ec-ink">
            Nouvelles demandes
          </h2>
          <span className="rounded-full bg-ec-yellow/30 px-2 py-0.5 text-[11px] font-black text-ec-ink">
            {pending.length}
          </span>
        </div>
        <p className="mb-3 ml-4 text-[11px] font-semibold text-ec-muted">
          Le client attend votre réponse
        </p>
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ec-rule bg-white px-6 py-8 text-center">
            <p className="text-sm font-semibold text-ec-muted">{PRO_COPY.emptyPending}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <ReservationCard key={r.id} r={r} variant="pending">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-ec-green text-sm font-extrabold text-white shadow-sm transition-all hover:bg-ec-green/90 hover:shadow-md active:scale-[0.98] touch-manipulation disabled:opacity-50"
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
              </ReservationCard>
            ))}
          </div>
        )}
      </section>

      {/* Pickup section */}
      <section>
        <div className="mb-1 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-ec-green" />
          <h2 className="text-sm font-extrabold text-ec-ink">
            Confirmées · à préparer
          </h2>
          <span className="rounded-full bg-ec-green/15 px-2 py-0.5 text-[11px] font-black text-ec-green">
            {pickup.length}
          </span>
        </div>
        <p className="mb-3 ml-4 text-[11px] font-semibold text-ec-muted">
          Le client va venir chercher sa commande
        </p>
        {pickup.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ec-rule bg-white px-6 py-8 text-center">
            <p className="text-sm font-semibold text-ec-muted">{PRO_COPY.emptyPickup}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pickup.map((r) => (
              <ReservationCard key={r.id} r={r} variant="pickup">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-ec-green text-sm font-extrabold text-white shadow-sm transition-all hover:bg-ec-green/90 hover:shadow-md active:scale-[0.98] touch-manipulation disabled:opacity-50"
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
              </ReservationCard>
            ))}
          </div>
        )}
      </section>

      {toastNode}
    </div>
  );
}
