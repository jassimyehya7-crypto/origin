import Link from "next/link";
import { Plus } from "lucide-react";
import { OfferStatusBadge, OfferTypeBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PRO_SHOP_ID } from "@/lib/pro-shop";
import { ensureShopDayClosed, getOffers } from "@/lib/store";
import { formatCHF } from "@/lib/utils";
import { PublishButton } from "./PublishButton";
import { VisualMark } from "@/components/VisualMark";

export const dynamic = "force-dynamic";

export default async function ProOffresPage() {
  await ensureShopDayClosed(PRO_SHOP_ID);
  const offers = (await getOffers()).filter((o) => o.shopId === PRO_SHOP_ID);

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.75rem] text-ec-ink">Offres</h1>
          <p className="text-sm font-semibold text-ec-muted">
            {offers.length} au total
          </p>
        </div>
        <Link
          href="/pro/offres/nouvelle"
          className="inline-flex h-12 items-center gap-1.5 rounded-[12px] bg-ec-yellow px-4 text-sm font-extrabold text-ec-ink"
        >
          <Plus className="h-4 w-4" />
          Créer
        </Link>
      </div>

      {offers.length === 0 ? (
        <EmptyState
          title="Aucune offre"
          description="Publiez en quelques champs."
        />
      ) : (
        <div className="space-y-3">
          {offers.map((o) => (
            <div
              key={o.id}
              className="ec-corner-cut border border-ec-rule bg-ec-surface p-4"
            >
              <div className="flex items-start gap-3">
                <VisualMark label={o.title} stored={o.emoji} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-ec-ink">{o.title}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <OfferTypeBadge type={o.type} />
                    <OfferStatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-ec-muted">
                    {formatCHF(o.price)} · {o.quantityLeft}/{o.quantityTotal}{" "}
                    {o.unit}
                  </p>
                </div>
                {o.status === "BROUILLON" && <PublishButton id={o.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
