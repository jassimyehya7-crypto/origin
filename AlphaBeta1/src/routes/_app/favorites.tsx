import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { MerchantCard } from "@/components/merchant-card";
import { ListRow } from "@/components/offer-cards";
import { findOffer, MERCHANTS } from "@/lib/data/catalog";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/favorites")({
  component: Favorites,
});

function Favorites() {
  const [tab, setTab] = useState<"offers" | "shops">("offers");
  const navigate = useNavigate();
  const favoriteIds = useAppStore((s) => s.favoriteOfferIds);
  const followedIds = useAppStore((s) => s.followedMerchantIds);
  const extraOffers = useAppStore((s) => s.extraOffers);
  const hiddenOfferIds = useAppStore((s) => s.hiddenOfferIds);
  const offers = favoriteIds
    .map((id) => findOffer(id, extraOffers, hiddenOfferIds))
    .filter((o): o is NonNullable<typeof o> => Boolean(o));
  const shops = MERCHANTS.filter((m) => followedIds.includes(m.id));

  return (
    <div>
      <header className="px-5 pb-3 pt-6 safe-top">
        <h1 className="font-display text-2xl font-bold tracking-tight">Favoris</h1>
        <div className="mt-4 flex rounded-full bg-soft p-1">
          {(["offers", "shops"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "h-10 flex-1 rounded-full text-sm font-semibold press",
                tab === t ? "bg-lime text-ink" : "text-mute",
              )}
            >
              {t === "offers" ? "Offres" : "Commerces"}
            </button>
          ))}
        </div>
      </header>
      {tab === "offers" ? (
        offers.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Aucune offre en favori"
            body="Touchez le cœur sur une offre pour la retrouver ici."
            action={{ label: "Explorer", onClick: () => navigate({ to: "/" }) }}
          />
        ) : (
          <div className="space-y-3 px-5 pb-4">
            {offers.map((o) => (
              <ListRow key={o.id} offer={o} />
            ))}
          </div>
        )
      ) : shops.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Aucun commerce suivi"
          body="Suivez un commerce pour voir ses nouvelles offres."
          action={{
            label: "Voir les commerces",
            onClick: () => navigate({ to: "/explore", search: { tab: "shops" } }),
          }}
        />
      ) : (
        <div className="space-y-3 px-5 pb-4">
          {shops.map((m) => (
            <MerchantCard key={m.id} merchant={m} />
          ))}
        </div>
      )}
    </div>
  );
}
