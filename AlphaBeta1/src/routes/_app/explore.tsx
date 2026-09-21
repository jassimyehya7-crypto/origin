import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Moon, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { GoogleTownMap, LockedCityCard } from "@/components/google-map";
import { MerchantCard } from "@/components/merchant-card";
import { ListRow } from "@/components/offer-cards";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { MAP_CITIES, type MapCity } from "@/lib/data/cities";
import { EXPLORE_FILTERS, exploreMatches, getMerchant } from "@/lib/data/catalog";
import { chf, discountPct, distLabel } from "@/lib/format";
import { extraMeters, isMerchantOpen, visibleMerchants, visibleOffers } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Tab = "map" | "list" | "shops";
type ShopSort = "all" | "near" | "rated" | "new";

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const locationId = useAppStore((s) => s.locationId);
  const radiusKm = useAppStore((s) => s.radiusKm);
  const setRadiusKm = useAppStore((s) => s.setRadiusKm);
  const stockByOffer = useAppStore((s) => s.stockByOffer);
  const extraOffers = useAppStore((s) => s.extraOffers);
  const hiddenOfferIds = useAppStore((s) => s.hiddenOfferIds);

  const onSelect = useCallback((id: string) => setSelectedId(id), []);
  const onZoneChange = useCallback((unlocked: boolean, city: MapCity, zoom: number) => {
    setZone((prev) =>
      prev.unlocked === unlocked && prev.city.id === city.id && prev.zoom === zoom
        ? prev
        : { unlocked, city, zoom },
    );
  }, []);

  const allOffers = visibleOffers({
    locationId,
    radiusKm,
    category: "all",
    stockByOffer,
    extraOffers,
    hiddenOfferIds,
  }).filter((o) => {
    const m = getMerchant(o.merchantId);
    if (!m) return false;
    return exploreMatches(m.category, filter);
  });

  // Filtrer les offres flash des commerces fermés (elles disparaissent)
  const offers = allOffers.filter((o) => {
    if (!mounted) return true; // SSR: afficher tout
    const m = getMerchant(o.merchantId);
    if (!m) return false;
    const open = isMerchantOpen(m, new Date());
    // Si commerce fermé + offre flash → masquer
    if (!open && o.flags.includes("flash")) return false;
    return true;
  });

  const merchants = visibleMerchants({ locationId, radiusKm, query: shopQuery }).filter((m) =>
    exploreMatches(m.category, filter),
  );

  const sortedShops = [...merchants].sort((a, b) => {
    if (shopSort === "rated") return b.rating - a.rating;
    if (shopSort === "new") return Number(Boolean(b.isNew)) - Number(Boolean(a.isNew));
    return a.distanceM - b.distanceM;
  });

  const selected = offers.find((o) => o.id === selectedId) ?? offers[0];

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
    // Vérifier si la majorité des commerces sont fermés
    const now = mounted ? new Date() : null;
    const merchantsOpen = merchants.filter((m) => now && isMerchantOpen(m, now)).length;
    const allClosed = mounted && merchants.length > 0 && merchantsOpen === 0;

    return (
      <div className="relative h-[calc(100dvh-5.75rem-env(safe-area-inset-bottom))] overflow-hidden">
        <GoogleTownMap
          offers={offers}
          selectedId={selected?.id ?? null}
          onSelect={onSelect}
          onZoneChange={onZoneChange}
          focusTick={focusTick}
        />
        {/* Overlay carte en veille */}
        {allClosed && (
          <div className="absolute inset-0 z-[400] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <Moon className="size-12 text-white/80 mb-3" />
            <p className="text-lg font-bold text-white">Carte en veille</p>
            <p className="text-sm text-white/80 mt-1">Les commerces sont fermés</p>
          </div>
        )}
        <header className="absolute inset-x-0 top-0 z-[500] bg-paper/90 px-5 pb-3 pt-4 backdrop-blur-md safe-top">
          {chrome}
        </header>
        {zone.unlocked ? (
          selected && zone.zoom >= 14 ? (
            <MiniCard offerId={selected.id} />
          ) : offers.length === 0 && zone.zoom >= 14 ? (
            <div className="absolute inset-x-0 bottom-0 z-[500] bg-paper">
              <EmptyState
                icon={MapPin}
                title="Rien dans cette zone"
                body="Élargissez le rayon pour voir plus de commerces."
                action={{
                  label: "Élargir à 10 km",
                  onClick: () => setRadiusKm(Math.max(10, radiusKm)),
                }}
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
          {offers.length === 0 ? (
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
            offers.map((o) => {
              const m = getMerchant(o.merchantId);
              const open = m && mounted ? isMerchantOpen(m, new Date()) : true;
              // Si commerce fermé → afficher avec badge "Reprend demain"
              if (!open) {
                return (
                  <div key={o.id} className="relative opacity-60">
                    <ListRow offer={o} />
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5">
                      <Moon className="size-2.5 text-indigo-300" />
                      <span className="text-[9px] font-bold text-white">
                        Reprend demain {m?.openFrom || ""}
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

function MiniCard({ offerId }: { offerId: string }) {
  const extraOffers = useAppStore((s) => s.extraOffers);
  const hiddenOfferIds = useAppStore((s) => s.hiddenOfferIds);
  const stockByOffer = useAppStore((s) => s.stockByOffer);
  const offer = visibleOffers({
    locationId: useAppStore.getState().locationId,
    radiusKm: 25,
    category: "all",
    stockByOffer,
    extraOffers,
    hiddenOfferIds,
  }).find((o) => o.id === offerId);
  const merchant = offer ? getMerchant(offer.merchantId) : undefined;
  const locationId = useAppStore((s) => s.locationId);
  if (!offer || !merchant) return null;
  const distance = merchant.distanceM + extraMeters(locationId);
  const original = offer.originalPrice;

  return (
    <div className="absolute inset-x-3 bottom-3 z-[500] rounded-[var(--radius-lg)] bg-card p-3 shadow-[var(--shadow-float)]">
      <div className="flex gap-3">
        <Photo src={offer.image} alt={offer.title} className="size-16 rounded-[var(--radius-sm)]" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-mute">{merchant.name}</p>
          <h3 className="font-display text-base font-semibold leading-snug">{offer.title}</h3>
          <p className="text-sm">
            {original && original > offer.price ? (
              <span className="text-faint line-through tabular">{chf(original)}</span>
            ) : null}
            <span className="ml-2 font-bold tabular text-deal">{chf(offer.price)}</span>
          </p>
          <p className="text-xs text-mute">
            Jusqu’à {offer.until} · {distLabel(distance)}
          </p>
        </div>
      </div>
      <Button asChild size="md" className="mt-3 w-full">
        <Link to="/offers/$offerId" params={{ offerId: offer.id }}>
          Voir l’offre
        </Link>
      </Button>
    </div>
  );
}
