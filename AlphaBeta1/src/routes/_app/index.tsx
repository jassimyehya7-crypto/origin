import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Flame, Heart, MapPin, Search, Sparkles, Zap } from "lucide-react";
import { CategoryPills } from "@/components/category-pills";
import { EmptyState } from "@/components/empty-state";
import { LocationButton } from "@/components/location-picker";
import { Logo } from "@/components/logo";
import {
  FeedCard,
  FlashCard,
  HorizontalRail,
  HotCard,
  NewCard,
  SectionHeader,
} from "@/components/offer-cards";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { visibleOffers } from "@/lib/selectors";

export const Route = createFileRoute("/_app/")({
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const locationId = useAppStore((s) => s.locationId);
  const radiusKm = useAppStore((s) => s.radiusKm);
  const setRadiusKm = useAppStore((s) => s.setRadiusKm);
  const category = useAppStore((s) => s.category);
  const setCategory = useAppStore((s) => s.setCategory);
  const followed = useAppStore((s) => s.followedMerchantIds);
  const stockByOffer = useAppStore((s) => s.stockByOffer);
  const extraOffers = useAppStore((s) => s.extraOffers);
  const hiddenOfferIds = useAppStore((s) => s.hiddenOfferIds);

  const offers = visibleOffers({
    locationId,
    radiusKm,
    category,
    stockByOffer,
    extraOffers,
    hiddenOfferIds,
  });
  const hot = offers.filter((o) => o.flags.includes("hot"));
  const fresh = offers.filter((o) => o.flags.includes("new"));
  const flash = offers.filter((o) => o.flags.includes("flash") && o.until);
  const fromFollowed = offers.filter((o) => followed.includes(o.merchantId));
  const isFiltered = category !== "all";
  const nearby = isFiltered ? offers : offers.slice(0, 8);

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/95 px-5 pb-3 pt-4 backdrop-blur-md safe-top">
        <div className="flex items-center justify-between gap-3">
          <Logo size="lg" />
          <LocationButton />
        </div>
      </header>

      <div className="px-5 pt-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/search" })}
          className="flex h-12 w-full items-center gap-3 rounded-[var(--radius-md)] bg-card px-4 text-left text-sm text-faint shadow-[var(--shadow-card)] press"
        >
          <Search className="size-4 text-ink" />
          Rechercher une offre, un produit, un commerce…
        </button>
      </div>

      <p className="px-5 pt-3 text-center text-[11px] font-semibold text-mute">
        Réservation gratuite · Pas de paiement en ligne · Retrait en magasin
      </p>

      <div className="px-5 pt-4">
        <CategoryPills value={category} onChange={setCategory} />
      </div>

      {offers.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Rien juste à côté pour le moment."
          body={`Aucune offre dans un rayon de ${radiusKm} km. Élargissez la recherche pour voir les commerces un peu plus loin.`}
          action={{
            label: radiusKm < 10 ? "Élargir à 10 km" : "Élargir à 25 km",
            onClick: () => setRadiusKm(radiusKm < 10 ? 10 : 25),
          }}
        />
      ) : (
        <div className="mt-6 space-y-8 pb-4">
          {!isFiltered && flash.length > 0 ? (
            <section className="px-5">
              <SectionHeader title="Flash" icon={<Zap className="size-5" />} />
              <HorizontalRail>
                {flash.map((o) => (
                  <FlashCard key={o.id} offer={o} />
                ))}
              </HorizontalRail>
            </section>
          ) : null}

          {!isFiltered && hot.length > 0 ? (
            <section className="px-5">
              <SectionHeader
                title="À saisir près de vous"
                icon={<Flame className="size-5" />}
              />
              <HorizontalRail>
                {hot.map((o) => (
                  <HotCard key={o.id} offer={o} />
                ))}
              </HorizontalRail>
            </section>
          ) : null}

          {nearby.length > 0 ? (
            <section className="px-5">
              <SectionHeader
                title="Près de vous"
                icon={<MapPin className="size-5" />}
                action={
                  isFiltered ? null : (
                    <Link
                      to="/explore"
                      search={{ tab: "list" }}
                      className="text-sm font-medium text-mute hover:text-ink"
                    >
                      Voir tout →
                    </Link>
                  )
                }
              />
              <div className="grid grid-cols-2 gap-3">
                {nearby.map((o) => (
                  <FeedCard key={o.id} offer={o} />
                ))}
              </div>
            </section>
          ) : null}

          {!isFiltered && fresh.length > 0 ? (
            <section className="px-5">
              <SectionHeader
                title="Nouveau aujourd’hui"
                icon={<Sparkles className="size-5" />}
              />
              <HorizontalRail>
                {fresh.map((o) => (
                  <NewCard key={o.id} offer={o} />
                ))}
              </HorizontalRail>
            </section>
          ) : null}

          {!isFiltered && fromFollowed.length > 0 ? (
            <section className="px-5">
              <SectionHeader
                title="Vos commerces"
                icon={<Heart className="size-5" />}
              />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {fromFollowed.map((o) => (
                  <FeedCard key={o.id} offer={o} />
                ))}
              </div>
            </section>
          ) : !isFiltered ? (
            <section className="px-5">
              <SectionHeader title="Vos commerces" icon={<Heart className="size-5" />} />
              <div className="rounded-[var(--radius-lg)] bg-card px-4 py-5 shadow-[var(--shadow-card)]">
                <p className="font-display text-base font-semibold">Suivez un commerce</p>
                <p className="mt-1 text-sm text-mute">
                  Les nouvelles offres de vos commerces apparaîtront ici.
                </p>
                <Button asChild size="sm" className="mt-3" variant="outline">
                  <Link to="/explore" search={{ tab: "shops" }}>
                    Explorer les commerces
                  </Link>
                </Button>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
