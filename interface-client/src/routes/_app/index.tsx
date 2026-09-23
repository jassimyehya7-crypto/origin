import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Flame, Heart, MapPin, Moon, Search, Sparkles, Zap } from "lucide-react";
import { useSyncExternalStore } from "react";
import { CategoryPills } from "@/components/category-pills";
import { EmptyState } from "@/components/empty-state";
import { LocationButton } from "@/components/location-picker";
import { Logo } from "@/components/logo";
import {
  FeedCard,
  FlashCard,
  HorizontalRail,
  NewCard,
  SectionHeader,
} from "@/components/offer-cards";
import { Button } from "@/components/ui/button";
import { getMerchant } from "@/lib/data/catalog";
import { isMerchantOpen, isOfferPaused, visibleOffers } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/_app/")({
  component: Home,
});

/** Date fixe pour le SSR : 3h du matin → tous les commerces sont fermés */
const SSR_DATE = new Date(2026, 0, 1, 3, 0);
const subscribeToMount = () => () => {};

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
  const userLat = useAppStore((s) => s.userLat);
  const userLng = useAppStore((s) => s.userLng);
  useAppStore((s) => s.catalogRevision);

  // Le snapshot serveur est aussi utilisé pendant l'hydratation. React bascule
  // ensuite sur l'heure du navigateur, sans modifier l'arbre en cours d'hydratation.
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false);
  const now = mounted ? new Date() : SSR_DATE;

  // visibleOffers reçoit now explicitement → cohérent SSR/client
  const allOffers = visibleOffers({
    locationId,
    radiusKm,
    category,
    stockByOffer,
    extraOffers,
    hiddenOfferIds,
    now,
    userLat,
    userLng,
  });

  // Séparer les offres par statut du commerce
  const openOffers = allOffers.filter((o) => {
    const merchant = getMerchant(o.merchantId);
    return merchant ? isMerchantOpen(merchant, now) : false;
  });
  const closedOffers = allOffers.filter((o) => {
    const merchant = getMerchant(o.merchantId);
    return merchant ? !isMerchantOpen(merchant, now) : true;
  });

  // Les nouveautés restent visibles quand un commerce ferme, en pause jusqu'à sa réouverture.
  const fresh = allOffers.filter((o) => o.flags.includes("new"));
  const flash = openOffers.filter((o) => o.flags.includes("flash") && o.until);
  const fromFollowedOpen = openOffers.filter((o) => followed.includes(o.merchantId));
  const isFiltered = category !== "all";
  const nearby = isFiltered ? openOffers : openOffers.slice(0, 8);

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

      {allOffers.length === 0 ? (
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
          {/* 1. FLASH — uniquement commerces ouverts */}
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

          {/* 2. NOUVEAU — offres ouvertes et en pause */}
          {!isFiltered && fresh.length > 0 ? (
            <section className="px-5">
              <SectionHeader
                title="Nouveau aujourd'hui"
                icon={<Sparkles className="size-5" />}
              />
              <HorizontalRail>
                {fresh.map((o) => (
                  <NewCard key={o.id} offer={o} paused={isOfferPaused(o, now)} />
                ))}
              </HorizontalRail>
            </section>
          ) : null}

          {/* 3. À SAISIR PRÈS DE VOUS — toutes les offres ouvertes proches */}
          {nearby.length > 0 ? (
            <section className="px-5">
              <SectionHeader
                title="À saisir près de vous"
                icon={<Flame className="size-5" />}
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

          {/* 4. VOS COMMERCES — offres ouvertes des commerces suivis */}
          {!isFiltered && fromFollowedOpen.length > 0 ? (
            <section className="px-5">
              <SectionHeader
                title="Vos commerces"
                icon={<Heart className="size-5" />}
              />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {fromFollowedOpen.map((o) => (
                  <FeedCard key={o.id} offer={o} />
                ))}
              </div>
            </section>
          ) : !isFiltered && followed.length === 0 ? (
            <section className="px-5">
              <SectionHeader title="Vos commerces" icon={<Heart className="size-5" />} />
              <div className="rounded-[var(--radius-lg)] bg-card px-4 py-5 shadow-[var(--shadow-card)]">
                <p className="font-display text-base font-semibold">Aucune offre chez vos commerçants</p>
                <p className="mt-1 text-sm text-mute">
                  Suivez un commerce pour recevoir ses nouvelles offres ici.
                </p>
                <Button asChild size="sm" className="mt-3" variant="outline">
                  <Link to="/explore" search={{ tab: "shops" }}>
                    Explorer les commerces
                  </Link>
                </Button>
              </div>
            </section>
          ) : null}

          {/* ON SE REVOIT DEMAIN — commerces fermés */}
          {!isFiltered && closedOffers.length > 0 ? (
            <section className="px-5">
              <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-lg)] bg-ink/5 px-4 py-3">
                <Moon className="size-5 text-mute" />
                <div>
                  <h2 className="font-display text-lg font-semibold tracking-tight">
                    On se revoit demain !
                  </h2>
                  <p className="text-xs text-mute">
                    Ces commerces sont fermés — leurs offres reprennent à l'ouverture
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {closedOffers.slice(0, 6).map((o) => {
                  const merchant = getMerchant(o.merchantId);
                  return (
                    <div key={o.id} className="rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-card)] opacity-60">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold">{merchant?.name || "Commerce"}</span>
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                          Fermé
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-mute">
                        <Moon className="size-3 text-indigo-400" />
                        <span>Ouvre à {merchant?.openFrom || "—"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
