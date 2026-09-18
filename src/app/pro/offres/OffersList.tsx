"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Tag, Clock } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCHF } from "@/lib/utils";
import type { Offer, OfferStatus } from "@/lib/types";
import { PublishButton } from "./PublishButton";
import { DeleteOfferButton } from "./DeleteOfferButton";
import { EditOfferButton } from "./EditOfferButton";

const STATUS_FR: Record<OfferStatus, string> = {
  BROUILLON: "Brouillon",
  PUBLIEE: "Publiée",
  EPUISEE: "Épuisée",
  EXPIREE: "Terminée",
  SUSPENDUE: "Suspendue",
};

const STATUS_STYLES: Record<OfferStatus, string> = {
  BROUILLON: "bg-ec-soft text-ec-muted",
  PUBLIEE: "bg-ec-green/15 text-ec-green",
  EPUISEE: "bg-ec-red/10 text-ec-red",
  EXPIREE: "bg-ec-soft text-ec-muted",
  SUSPENDUE: "bg-ec-yellow/40 text-ec-ink",
};

/** Live countdown showing remaining hours/minutes for time-limited offers */
function OfferCountdown({ offer }: { offer: Offer }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  // If no duration, show stock info
  if (!offer.durationHours || !offer.publishedAt) {
    return (
      <span className="flex items-center gap-1">
        <Tag className="h-3 w-3" />
        Stock {offer.quantityLeft}/{offer.quantityTotal}
      </span>
    );
  }

  const publishedAt = new Date(offer.publishedAt).getTime();
  const expiresAt = publishedAt + offer.durationHours * 3600_000;
  const remaining = Math.max(0, expiresAt - now);

  if (remaining <= 0) {
    return (
      <span className="flex items-center gap-1 text-ec-red">
        <Clock className="h-3 w-3" />
        Expirée
      </span>
    );
  }

  const hours = Math.floor(remaining / 3600_000);
  const minutes = Math.floor((remaining % 3600_000) / 60_000);

  return (
    <span className="flex items-center gap-1">
      <Clock className="h-3 w-3" />
      {hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`} restants
    </span>
  );
}

export function OffersList({ initialOffers }: { initialOffers: Offer[] }) {
  const [offers, setOffers] = useState(initialOffers);

  function handleDeleted(id: string) {
    setOffers((prev) => prev.filter((o) => o.id !== id));
  }

  const published = offers.filter((o) => o.status === "PUBLIEE").length;
  const drafts = offers.filter((o) => o.status === "BROUILLON").length;

  return (
    <>
      <div className="mb-5">
        <h1 className="font-display text-[1.75rem] leading-tight text-ec-ink">Offres</h1>
        <p className="mt-1 text-sm font-semibold text-ec-muted">
          {offers.length} au total · {published} publiées · {drafts} brouillons
        </p>
      </div>

      {offers.length === 0 ? (
        <EmptyState
          title="Aucune offre"
          description="Ajoutez une offre en quelques champs."
        />
      ) : (
        <div className="space-y-3">
          {offers.map((o) => (
            <div
              key={o.id}
              className="group rounded-2xl border border-ec-rule bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ec-soft">
                  {o.imageUrl ? (
                    <Image
                      src={o.imageUrl}
                      alt=""
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                      unoptimized
                    />
                  ) : (
                    <Tag className="h-6 w-6 text-ec-muted/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-extrabold text-ec-ink">{o.title}</p>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${STATUS_STYLES[o.status]}`}>
                      {STATUS_FR[o.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-ec-ink">
                    {formatCHF(o.price)}
                    {o.originalPrice && (
                      <span className="ml-1.5 text-xs font-semibold text-ec-muted line-through">
                        {formatCHF(o.originalPrice)}
                      </span>
                    )}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] font-semibold text-ec-muted">
                    <OfferCountdown offer={o} />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ec-rule pt-3">
                {o.status === "BROUILLON" && <PublishButton id={o.id} />}
                {o.status !== "EXPIREE" && (
                  <EditOfferButton offer={o} onUpdated={() => {}} />
                )}
                {o.status !== "EXPIREE" && <DeleteOfferButton id={o.id} onDeleted={handleDeleted} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
