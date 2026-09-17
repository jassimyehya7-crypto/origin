import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PRO_SHOP_ID } from "@/lib/pro-shop";
import { ensureShopDayClosed, getOffers } from "@/lib/store";
import { formatCHF, zurichParts } from "@/lib/utils";
import type { Offer, OfferStatus } from "@/lib/types";
import { PublishButton } from "./PublishButton";
import { DeleteOfferButton } from "./DeleteOfferButton";
import { OffresToast } from "./OffresToast";

export const dynamic = "force-dynamic";

const STATUS_FR: Record<OfferStatus, string> = {
  BROUILLON: "Brouillon",
  PUBLIEE: "Publiée",
  EPUISEE: "Épuisée",
  EXPIREE: "Terminée",
  SUSPENDUE: "Suspendue",
};

function isTodayZurich(iso?: string): boolean {
  if (!iso) return false;
  const today = zurichParts().dateKey;
  return zurichParts(new Date(iso)).dateKey === today;
}

function proListOffers(all: Offer[]): Offer[] {
  return all
    .filter((o) => {
      if (o.status === "PUBLIEE" || o.status === "BROUILLON") return true;
      if (o.status === "EXPIREE") {
        return isTodayZurich(o.publishedAt || o.createdAt);
      }
      return false;
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt || b.createdAt).getTime() -
        new Date(a.publishedAt || a.createdAt).getTime()
    );
}

export default async function ProOffresPage() {
  await ensureShopDayClosed(PRO_SHOP_ID);
  const offers = proListOffers(
    (await getOffers()).filter((o) => o.shopId === PRO_SHOP_ID)
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <Suspense fallback={null}>
        <OffresToast />
      </Suspense>

      <div className="mb-5">
        <h1 className="font-display text-[1.75rem] text-ec-ink">Offres</h1>
        <p className="text-sm font-semibold text-ec-muted">
          {offers.length} au total
        </p>
      </div>

      <Link
        href="/pro/offres/nouvelle"
        className="mb-5 flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-ec-yellow text-base font-extrabold text-ec-ink shadow-sm"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
        Ajouter une offre
      </Link>

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
              className="ec-corner-cut border border-ec-rule bg-ec-surface p-4"
            >
              <div className="flex items-start gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-ec-soft">
                  {o.imageUrl ? (
                    <Image
                      src={o.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-extrabold text-ec-muted">
                      —
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-ec-ink">{o.title}</p>
                  <p className="mt-0.5 text-sm font-semibold text-ec-ink">
                    {formatCHF(o.price)} · {o.durationHours ? `durée ${o.durationHours} h` : `stock ${o.quantityLeft}/${o.quantityTotal}`}
                  </p>
                  <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-ec-muted">
                    {STATUS_FR[o.status]}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {o.status === "BROUILLON" && <PublishButton id={o.id} />}
                {o.status !== "EXPIREE" && <DeleteOfferButton id={o.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
