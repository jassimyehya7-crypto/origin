import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { BackCircle, PageShell } from "@/components/back-header";
import { MerchantCard } from "@/components/merchant-card";
import { ListRow } from "@/components/offer-cards";
import { visibleMerchants, visibleOffers } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const locationId = useAppStore((s) => s.locationId);
  const radiusKm = useAppStore((s) => s.radiusKm);
  const stockByOffer = useAppStore((s) => s.stockByOffer);
  const extraOffers = useAppStore((s) => s.extraOffers);
  const hiddenOfferIds = useAppStore((s) => s.hiddenOfferIds);

  const offers = useMemo(
    () =>
      visibleOffers({
        locationId,
        radiusKm,
        category: "all",
        stockByOffer,
        query: q,
        extraOffers,
        hiddenOfferIds,
      }),
    [locationId, radiusKm, stockByOffer, q, extraOffers, hiddenOfferIds],
  );
  const shops = useMemo(
    () => visibleMerchants({ locationId, radiusKm, query: q }),
    [locationId, radiusKm, q],
  );

  return (
    <PageShell>
      <header className="flex items-center gap-3 px-5 pb-3 pt-5 safe-top">
        <BackCircle />
        <label className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mute" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une offre, un produit, un commerce…"
            className="h-12 w-full rounded-[var(--radius-md)] bg-card pl-10 pr-4 text-sm shadow-[var(--shadow-card)] placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          />
        </label>
      </header>
      <div className="space-y-6 px-5 pb-10">
        <section>
          <h2 className="font-display text-lg font-semibold">Offres</h2>
          <div className="mt-3 space-y-3">
            {offers.length === 0 ? (
              <p className="text-sm text-mute">Aucune offre pour « {q || "…"} ».</p>
            ) : (
              offers.map((o) => <ListRow key={o.id} offer={o} />)
            )}
          </div>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold">Commerces</h2>
          <div className="mt-3 space-y-3">
            {shops.length === 0 ? (
              <p className="text-sm text-mute">Aucun commerce pour « {q || "…"} ».</p>
            ) : (
              shops.map((m) => <MerchantCard key={m.id} merchant={m} />)
            )}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
