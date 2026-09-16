"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, MapPin } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { CancelReservationButton } from "@/components/client/CancelReservationButton";
import {
  EC_PHONE_KEY,
  EC_PRENOM_KEY,
  EC_SOFT_ID_KEY,
  ensureSoftUserId,
} from "@/lib/soft-profile";
import { formatCHF, formatDateTime } from "@/lib/utils";
import type { Offer, Reservation, Shop } from "@/lib/types";
import { VisualMark } from "@/components/VisualMark";
import { offerPhoto } from "@/lib/offer-photos";

type Row = Reservation & { offer?: Offer | null; shop?: Shop | null };

export function MyReservations({ tab }: { tab: "avenir" | "historique" }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(false);
  const [prenom, setPrenom] = useState("");

  useEffect(() => {
    const p = (localStorage.getItem(EC_PRENOM_KEY) || "").trim();
    const phone = (localStorage.getItem(EC_PHONE_KEY) || "").trim();
    const softUserId =
      localStorage.getItem(EC_SOFT_ID_KEY) || ensureSoftUserId();
    setPrenom(p);
    (async () => {
      try {
        const params = new URLSearchParams();
        if (softUserId) params.set("softUserId", softUserId);
        if (phone) params.set("clientPhone", phone);
        if (!softUserId && !phone) {
          setRows([]);
          return;
        }
        const res = await fetch(`/api/reservations?${params.toString()}`);
        if (!res.ok) {
          setRows([]);
          return;
        }
        const data = await res.json();
        const all: Row[] = data.reservations || [];
        // Server already filtered; keep softUserId / phone match as safety net
        const mine = all.filter((r) => {
          if (softUserId && r.softUserId === softUserId) return true;
          if (phone && r.clientPhone === phone) return true;
          return false;
        });
        setRows(mine);
      } catch {
        setRows([]);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <p className="px-4 py-8 text-center text-sm font-semibold text-ec-muted">
        Chargement…
      </p>
    );
  }

  const upcoming = rows.filter((r) =>
    ["EN_ATTENTE", "CONFIRMEE"].includes(r.status)
  );
  const history = rows.filter(
    (r) => !["EN_ATTENTE", "CONFIRMEE"].includes(r.status)
  );
  const list = tab === "avenir" ? upcoming : history;

  return (
    <>
      <div className="mb-3 flex rounded-lg bg-ec-soft p-1 mx-4">
        <Link
          href="/reservations"
          className={`flex-1 rounded-[12px] py-2.5 text-center text-sm font-extrabold ${
            tab === "avenir"
              ? "bg-ec-ink text-white"
              : "text-ec-muted"
          }`}
        >
          À venir ({upcoming.length})
        </Link>
        <Link
          href="/reservations?tab=historique"
          className={`flex-1 rounded-[12px] py-2.5 text-center text-sm font-extrabold ${
            tab === "historique"
              ? "bg-ec-ink text-white"
              : "text-ec-muted"
          }`}
        >
          Historique ({history.length})
        </Link>
      </div>

      <div className="safe-pb space-y-3 px-4">
        {!prenom && list.length === 0 ? (
          <EmptyState
            title="Aucune réservation"
            description="Réserve une offre — ton prénom restera sur cet appareil."
          />
        ) : list.length === 0 ? (
          <EmptyState
            title={
              tab === "avenir"
                ? "Aucune réservation en cours"
                : "Pas encore d'historique"
            }
            description="Réservez une offre à Villeneuve."
          />
        ) : (
          list.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-ec-rule bg-white p-3 shadow-sm"
            >
              <Link
                href={`/confirmation/${r.id}`}
                className="flex gap-3"
              >
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-ec-soft">
                  {r.offer && offerPhoto(r.offer) ? <Image src={offerPhoto(r.offer)!} alt="" fill className="object-cover" sizes="96px" /> : <VisualMark label={r.offer?.title || "Offre"} stored={r.offer?.emoji} size="lg" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate font-extrabold text-ec-ink">
                      {r.offer?.title}
                    </h3>
                    <ChevronRight className="h-5 w-5 shrink-0 text-ec-ink" />
                  </div>
                  <p className="text-xs font-semibold text-ec-muted">
                    {r.shop?.name} · {r.quantity}× ·{" "}
                    {r.offer ? formatCHF(r.offer.price * r.quantity) : ""}
                  </p>
                  <p className="mt-1 rounded-sm bg-rose-50 px-2 py-1 text-[11px] font-black text-rose-500">
                    {r.status === "CONFIRMEE" ? "À retirer aujourd’hui" : r.status === "EN_ATTENTE" ? "En attente de confirmation" : formatDateTime(r.createdAt)}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-ec-muted"><MapPin className="h-3 w-3" /> {r.shop?.address}</p>
                </div>
              </Link>
              <CancelReservationButton
                reservationId={r.id}
                status={r.status}
                compact
              />
            </div>
          ))
        )}
        {list.length === 0 && (
          <div className="text-center">
            <Link href="/" className="text-sm font-extrabold text-ec-blue">
              Voir les offres
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
