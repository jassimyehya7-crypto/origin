import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";
import { BackCircle, IconCircle, PageShell } from "@/components/back-header";
import { DiscountBadge } from "@/components/discount-badge";
import { HeartButton } from "@/components/heart-button";
import { Photo } from "@/components/photo";
import { StockBadge } from "@/components/stock-badge";
import { Button } from "@/components/ui/button";
import { findOffer, getMerchant, liveOffersForMerchant } from "@/lib/data/catalog";
import { chf, discountPct, distLabel, walkMinutes } from "@/lib/format";
import { OFFER_TYPE_LABELS } from "@/lib/labels";
import { extraMeters } from "@/lib/selectors";
import { useAppStore, useStock } from "@/lib/store";

export const Route = createFileRoute("/offers/$offerId")({
  component: OfferDetail,
});

function OfferDetail() {
  const { offerId } = Route.useParams();
  const extraOffers = useAppStore((s) => s.extraOffers);
  const hiddenOfferIds = useAppStore((s) => s.hiddenOfferIds);
  const offer = findOffer(offerId, extraOffers, hiddenOfferIds);
  const merchant = offer ? getMerchant(offer.merchantId) : undefined;
  const locationId = useAppStore((s) => s.locationId);
  const stock = useStock(offerId, offer?.stock ?? 0);

  if (!offer || !merchant) {
    return (
      <PageShell>
        <div className="p-6">
          <BackCircle />
          <p className="mt-8 text-sm text-mute">Cette offre n’est plus disponible.</p>
        </div>
      </PageShell>
    );
  }

  const distance = merchant.distanceM + extraMeters(locationId);
  const others = liveOffersForMerchant(merchant.id, extraOffers, hiddenOfferIds).filter(
    (o) => o.id !== offer.id,
  );
  const pct = discountPct(offer.originalPrice, offer.price);

  return (
    <PageShell>
      <div className="relative">
        <Photo src={offer.image} alt={offer.title} className="h-[58vw] max-h-80 w-full min-h-56" />
        <StockBadge stock={stock} className="absolute bottom-4 left-4" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
          <BackCircle />
          <div className="flex gap-2">
            <HeartButton offerId={offer.id} />
            <IconCircle
              label="Partager"
              onClick={async () => {
                const url = window.location.href;
                try {
                  if (navigator.share) {
                    await navigator.share({ title: offer.title, url });
                  } else {
                    await navigator.clipboard.writeText(url);
                    toast("Lien copié");
                  }
                } catch {
                  /* dismissed */
                }
              }}
            >
              <Share2 className="size-4.5" />
            </IconCircle>
          </div>
        </div>
      </div>

      <div className="px-5 pb-36 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <DiscountBadge pct={pct} />
          <StockBadge stock={stock} />
          <span className="inline-flex h-6 items-center rounded-full bg-soft px-2 text-[11px] font-bold uppercase tracking-wide text-ink">
            {OFFER_TYPE_LABELS[offer.type]}
          </span>
        </div>
        <p className="mt-3 text-sm font-medium text-mute">{merchant.name}</p>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase leading-none tracking-tight">
          {offer.title}
        </h1>
        <p className="mt-3 flex items-baseline gap-3">
          {offer.originalPrice && offer.originalPrice > offer.price ? (
            <span className="text-base text-faint line-through tabular">{chf(offer.originalPrice)}</span>
          ) : null}
          <span className="text-2xl font-bold tabular text-deal">{chf(offer.price)}</span>
        </p>

        <ul className="mt-5 space-y-2.5 text-sm">
          <li className="flex items-center gap-3">
            <Clock className="size-4 text-mute" />
            Aujourd’hui jusqu’à {offer.until}
          </li>
          <li className="flex items-center gap-3">
            <MapPin className="size-4 text-mute" />
            {distLabel(distance)} · environ {walkMinutes(distance)} min à pied
          </li>
        </ul>

        <section className="mt-8 rounded-[var(--radius-lg)] bg-card p-3.5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-mute">À propos du commerce</p>
          <div className="mt-3 flex items-center gap-3">
            <Photo src={merchant.banner} alt="" className="size-14 rounded-[var(--radius-sm)]" />
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold">{merchant.name}</p>
              <p className="text-xs text-mute">
                {merchant.rating.toFixed(1)} · {merchant.reviewCount} avis · {distLabel(distance)}
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/merchants/$merchantId" params={{ merchantId: merchant.id }}>
                Voir
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-mute">{merchant.hours}</p>
          {others.length > 0 ? (
            <p className="mt-2 text-xs text-mute">
              {others.length} autre{others.length > 1 ? "s" : ""} offre{others.length > 1 ? "s" : ""} disponible{others.length > 1 ? "s" : ""}
            </p>
          ) : null}
        </section>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 px-5 pt-3 backdrop-blur-md"
        style={{ paddingBottom: "calc(0.85rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-lg">
          {stock < 1 ? (
            <Button size="lg" disabled>
              Épuisée
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link to="/reserve/$offerId" params={{ offerId: offer.id }}>
                Réserver gratuitement
              </Link>
            </Button>
          )}
          <p className="mt-2 text-center text-xs text-mute">Aucun paiement en ligne nécessaire</p>
        </div>
      </div>
    </PageShell>
  );
}
