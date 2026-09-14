"use client";

import Link from "next/link";
import { OfferCard } from "@/components/OfferCard";
import { useClientLocation } from "@/hooks/useClientLocation";
import type { Offer, Shop } from "@/lib/types";

type LocationOfferFeedProps = {
  offers: Offer[];
  shopMap: Record<string, Shop>;
};

/** Filters published offers to the covered / nearest-covered city shops. */
export function LocationOfferFeed({ offers, shopMap }: LocationOfferFeedProps) {
  const { status, feedShopIds, feedCity, covered } = useClientLocation();

  const filtered =
    status === "loading" && feedShopIds.size === 0
      ? offers
      : feedShopIds.size > 0
        ? offers.filter((o) => feedShopIds.has(o.shopId))
        : offers;

  if (filtered.length === 0) {
    return (
      <div className="ec-corner-cut border border-dashed border-ec-rule bg-ec-surface px-6 py-12 text-center">
        <p className="font-display text-lg text-ec-ink">Rien pour ce filtre</p>
        <p className="mt-1 text-sm text-ec-muted">
          {covered
            ? "Changez de catégorie, ou revenez plus tard."
            : `Pas encore d’offres à ${feedCity}. Revenez plus tard.`}
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-extrabold text-ec-blue"
        >
          Voir tout
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {filtered.map((offer) => (
        <OfferCard
          key={offer.id}
          offer={offer}
          shop={shopMap[offer.shopId]}
        />
      ))}
    </div>
  );
}
