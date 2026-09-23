import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { liveOffersForMerchant } from "@/lib/data/catalog";
import { chf } from "@/lib/format";
import { OFFER_TYPE_LABELS, PRO_SHOP_ID } from "@/lib/labels";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/pro/offers")({
  component: ProOffers,
});

function ProOffers() {
  const extraOffers = useAppStore((s) => s.extraOffers);
  const hiddenOfferIds = useAppStore((s) => s.hiddenOfferIds);
  const stockByOffer = useAppStore((s) => s.stockByOffer);
  const hideOffer = useAppStore((s) => s.hideOffer);
  const offers = liveOffersForMerchant(PRO_SHOP_ID, extraOffers, hiddenOfferIds);

  return (
    <div className="px-5 py-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Vos offres</h1>
          <p className="text-sm text-mute">{offers.length} en ligne</p>
        </div>
        <Button asChild size="sm">
          <Link to="/pro/new">Créer</Link>
        </Button>
      </div>
      <div className="mt-5 space-y-3">
        {offers.length === 0 ? (
          <p className="rounded-[var(--radius-md)] bg-card px-4 py-5 text-sm text-mute shadow-[var(--shadow-card)]">
            Aucune offre publiée.
          </p>
        ) : (
          offers.map((o) => {
            const stock = stockByOffer[o.id] ?? o.stock;
            return (
              <article key={o.id} className="flex gap-3 rounded-[var(--radius-lg)] bg-card p-3 shadow-[var(--shadow-card)]">
                <Photo src={o.image} alt="" className="size-16 rounded-[var(--radius-sm)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-mute">
                    {OFFER_TYPE_LABELS[o.type]}
                  </p>
                  <h2 className="font-display text-[15px] font-semibold">{o.title}</h2>
                  <p className="text-sm font-bold tabular">{chf(o.price)}</p>
                  <p className="text-xs text-mute">
                    {o.availabilityMode === "duration" && o.durationMinutes
                      ? `Valable ${o.durationMinutes < 60 ? `${o.durationMinutes} min` : `${o.durationMinutes / 60} h`} · pause à la fermeture`
                      : `${stock} ${o.unit}${stock > 1 ? "s" : ""} disponible${stock > 1 ? "s" : ""}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="soft"
                  onClick={async () => {
                    const hidden = await hideOffer(o.id);
                    toast(hidden ? "Offre retirée" : "Impossible de retirer cette offre");
                  }}
                >
                  Retirer
                </Button>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
