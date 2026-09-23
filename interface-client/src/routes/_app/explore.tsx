import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Moon, Search, X } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { GoogleTownMap, LockedCityCard } from "@/components/google-map";
import { MerchantCard } from "@/components/merchant-card";
import { ListRow } from "@/components/offer-cards";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { MAP_CITIES, type MapCity } from "@/lib/data/cities";
import { EXPLORE_FILTERS, exploreMatches, getActiveMerchants, getMerchant } from "@/lib/data/catalog";
import { chf } from "@/lib/format";
import { isMerchantOpen, isOfferPaused, visibleMerchants, visibleOffers } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";
import type { Merchant, Offer } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "map" | "list" | "shops";
type ShopSort = "all" | "near" | "rated" | "new";

/** Date fixe pour le SSR : 3h du matin → tous les commerces sont fermés */
const SSR_DATE = new Date(2026, 0, 1, 3, 0);

export const Route = createFileRoute("/_app/explore")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: (s.tab === "list" || s.tab === "shops" ? s.tab : "map") as Tab,
  }),
  component: Explore,
});

function Explore() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [filter, setFilter] = useState("all");
  const [shopSort, setShopSort] = useState<ShopSort>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shopQuery, setShopQuery] = useState("");
  const [zone, setZone] = useState<{ unlocked: boolean; city: MapCity; zoom: number }>({
    unlocked: true,
    city: MAP_CITIES[0],
    zoom: 16,
  });
  const [focusTick, setFocusTick] = useState(0);

  // SSR et premier rendu client = même date fixe → pas de mismatch
  const [now, setNow] = useState(SSR_DATE);
  useEffect(() => {
    const refresh = () => setNow(new Date());
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const locationId = useAppStore((s) => s.locationId);
  const radiusKm = useAppStore((s) => s.radiusKm);
  const setRadiusKm = useAppStore((s) => s.setRadiusKm);
  const stockByOffer = useAppStore((s) => s.stockByOffer);
  const extraOffers = useAppStore((s) => s.extraOffers);
  const hiddenOfferIds = useAppStore((s) => s.hiddenOfferIds);
  const userLat = useAppStore((s) => s.userLat);
  const userLng = useAppStore((s) => s.userLng);

  const onSelect = useCallback((id: string) => setSelectedId(id), []);
  const onZoneChange = useCallback((unlocked: boolean, city: MapCity, zoom: number) => {
    setZone((prev) =>
      prev.unlocked === unlocked && prev.city.id === city.id && prev.zoom === zoom
        ? prev
        : { unlocked, city, zoom },
    );
  }, []);

  // visibleOffers reçoit now → cohérent SSR/client
  // Le filtrage flash/commerces fermés est fait DANS visibleOffers
  const allOffers = visibleOffers({
    locationId,
    radiusKm,
    category: "all",
    stockByOffer,
    extraOffers,
    hiddenOfferIds,
    now,
    userLat,
    userLng,
  }).filter((o) => {
    const m = getMerchant(o.merchantId);
    if (!m) return false;
    return exploreMatches(m.category, filter);
  });

  const merchants = visibleMerchants({ locationId, radiusKm, query: shopQuery, userLat, userLng }).filter((m) =>
    exploreMatches(m.category, filter),
  );
  // La carte montre chaque commerce de la plateforme, même sans offre ou hors du rayon de la liste.
  const mapMerchants = getActiveMerchants().filter((m) => exploreMatches(m.category, filter));
  const mapOffers = visibleOffers({
    locationId,
    radiusKm: 1000,
    category: "all",
    stockByOffer,
    extraOffers,
    hiddenOfferIds,
    now,
  });

  const sortedShops = [...merchants].sort((a, b) => {
    if (shopSort === "rated") return b.rating - a.rating;
    if (shopSort === "new") return Number(Boolean(b.isNew)) - Number(Boolean(a.isNew));
    return a.distanceM - b.distanceM;
  });

  const selected = mapMerchants.find((m) => m.id === selectedId);

  const chrome = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">Explorer</h1>
        <div className="flex rounded-full bg-soft p-1">
          {(["map", "list", "shops"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => navigate({ search: { tab: t } })}
              className={cn(
                "h-8 rounded-full px-3 text-xs font-semibold capitalize press",
                tab === t ? "bg-lime text-ink" : "text-mute",
              )}
            >
              {t === "map" ? "Carte" : t === "list" ? "Liste" : "Commerces"}
            </button>
          ))}
        </div>
      </div>
      <div className="no-scrollbar mt-3 -mx-1 flex gap-2 overflow-x-auto px-1">
        {EXPLORE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3.5 text-sm font-medium press",
              filter === f.id ? "bg-lime text-ink" : "bg-card shadow-[var(--shadow-card)]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </>
  );

  if (tab === "map") {
    return (
      <div className="relative h-[calc(100dvh-5.75rem-env(safe-area-inset-bottom))] overflow-hidden">
        <GoogleTownMap
          merchants={mapMerchants}
          now={now}
          selectedId={selected?.id ?? null}
          onSelect={onSelect}
          onZoneChange={onZoneChange}
          focusTick={focusTick}
        />
        <header className="absolute inset-x-0 top-0 z-[500] bg-paper/90 px-5 pb-3 pt-4 backdrop-blur-md safe-top">
          {chrome}
        </header>
        {zone.unlocked ? (
          selected && zone.zoom >= 14 ? (
            <MerchantMapCard
              merchant={selected}
              offers={mapOffers.filter((o) => o.merchantId === selected.id)}
              open={isMerchantOpen(selected, now)}
              onClose={() => setSelectedId(null)}
            />
          ) : mapMerchants.length === 0 && zone.zoom >= 14 ? (
            <div className="absolute inset-x-0 bottom-0 z-[500] bg-paper">
              <EmptyState
                icon={MapPin}
                title="Aucun commerce dans cette catégorie"
                body="Essayez une autre catégorie pour voir les commerces de Villeneuve."
              />
            </div>
          ) : null
        ) : (
          <LockedCityCard city={zone.city} onBack={() => setFocusTick((n) => n + 1)} />
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/95 px-5 pb-3 pt-4 backdrop-blur-md safe-top">
        {chrome}
      </header>

      {tab === "list" ? (
        <div className="space-y-3 px-5 py-4">
          {allOffers.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="Rien juste à côté pour le moment."
              body="Aucune offre dans ce rayon."
              action={{
                label: "Élargir à 10 km",
                onClick: () => setRadiusKm(10),
              }}
            />
          ) : (
            allOffers.map((o) => {
              const m = getMerchant(o.merchantId);
              const paused = m ? isOfferPaused(o, now) : false;
              if (paused) {
                return (
                  <div key={o.id} className="relative opacity-60">
                    <ListRow offer={o} />
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5">
                      <Moon className="size-2.5 text-indigo-300" />
                      <span className="text-[9px] font-bold text-white">
                        Reprend {m?.openFrom || "demain"}
                      </span>
                    </div>
                  </div>
                );
              }
              return <ListRow key={o.id} offer={o} />;
            })
          )}
        </div>
      ) : null}

      {tab === "shops" ? (
        <div className="px-5 py-4">
          <label className="relative block">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mute" />
            <input
              value={shopQuery}
              onChange={(e) => setShopQuery(e.target.value)}
              placeholder="Rechercher un commerce…"
              className="h-12 w-full rounded-[var(--radius-md)] bg-card pl-10 pr-4 text-sm shadow-[var(--shadow-card)] placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
          </label>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {(
              [
                ["all", "Tous"],
                ["near", "À proximité"],
                ["rated", "Les mieux notés"],
                ["new", "Nouveaux"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setShopSort(id)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-3.5 text-sm font-medium press",
                  shopSort === id ? "bg-lime text-ink" : "bg-card shadow-[var(--shadow-card)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {sortedShops.map((m) => (
              <MerchantCard key={m.id} merchant={m} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MerchantMapCard({
  merchant,
  offers,
  open,
  onClose,
}: {
  merchant: Merchant;
  offers: Offer[];
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-x-3 bottom-3 z-[500] max-h-[55%] overflow-y-auto rounded-[var(--radius-lg)] bg-card p-3 shadow-[var(--shadow-float)]">
      <div className="flex gap-3">
        <Photo src={merchant.banner} alt={merchant.name} className="size-16 shrink-0 rounded-[var(--radius-sm)]" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold leading-snug">{merchant.name}</h3>
          <p className="mt-0.5 text-xs text-mute">{merchant.address}</p>
          <p className={cn("mt-1 text-xs font-semibold", open ? "text-ink" : "text-deal")}>
            {open ? `Ouvert jusqu’à ${merchant.openUntil}` : `Fermé · Ouvre à ${merchant.openFrom}`}
          </p>
        </div>
        <button
          type="button"
          aria-label="Fermer la fiche du commerce"
          onClick={onClose}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-soft press"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 border-t border-line pt-2">
        <p className="text-xs font-semibold text-mute">Offres du commerce</p>
        {offers.length > 0 ? (
          <div className="mt-1 space-y-1">
            {offers.slice(0, 2).map((offer) => (
              <div key={offer.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{offer.title}</span>
                <span className="shrink-0 font-semibold text-deal">{chf(offer.price)}</span>
              </div>
            ))}
            {offers.length > 2 ? (
              <p className="text-xs text-mute">+ {offers.length - 2} autre{offers.length > 3 ? "s" : ""} offre{offers.length > 3 ? "s" : ""}</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-1 text-sm text-mute">
            {open ? "Aucune offre en ce moment." : "Les offres reprendront à l’ouverture."}
          </p>
        )}
      </div>
      <Button asChild size="md" className="mt-3 w-full">
        <Link to="/merchants/$merchantId" params={{ merchantId: merchant.id }}>
          Voir le commerce et ses offres
        </Link>
      </Button>
    </div>
  );
}
