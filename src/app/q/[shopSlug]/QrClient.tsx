"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { OfferCard } from "@/components/OfferCard";
import { Logo } from "@/components/Logo";
import type { Offer, Shop } from "@/lib/types";
import { CATEGORY_LABELS, OFFER_TYPE_LABELS } from "@/lib/labels";
import type { OfferType } from "@/lib/types";
import { VisualMark } from "@/components/VisualMark";
import { Search, SlidersHorizontal, X } from "lucide-react";

const ALL_TYPES: OfferType[] = ["PROMO", "FLASH", "ARRIVAGE", "EXCLUSIVITE", "DERNIERE_MINUTE"];

function OfferSkeleton() {
  return (
    <div className="mb-2 overflow-hidden rounded-[4px] bg-white shadow-[0_4px_18px_rgba(17,24,32,0.08)] animate-pulse">
      <div className="grid min-h-[148px] grid-cols-[46%_54%]">
        <div className="bg-ec-soft" />
        <div className="flex flex-col gap-2 px-3 py-2.5">
          <div className="h-4 w-3/4 rounded bg-ec-soft" />
          <div className="h-5 w-1/2 rounded bg-ec-soft" />
          <div className="h-9 w-full rounded bg-ec-soft" />
          <div className="mt-auto h-10 w-full rounded bg-ec-soft" />
        </div>
      </div>
    </div>
  );
}

export function QrClient({
  shop,
  offers,
}: {
  shop: Shop;
  offers: Offer[];
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<OfferType | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Show content immediately (server-rendered), but track load
    setLoaded(true);
  }, []);

  useEffect(() => {
    const key = "ec_scan_session";
    let sid = localStorage.getItem(key);
    if (!sid) {
      sid = `scan_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, sid);
    }
    fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopSlug: shop.slug,
        sessionId: sid,
        browsed: true,
      }),
    })
      .catch(() => {});
  }, [shop.slug]);

  // Filter + search
  const filtered = useMemo(() => {
    let result = offers;
    if (filterType) {
      result = result.filter((o) => o.type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          (o.description || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [offers, filterType, search]);

  const hasFilters = filterType !== null || search.trim() !== "";

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-ec-paper">
      <header className="bg-ec-ink px-4 pb-8 pt-6 text-white">
        <Logo inverted size="sm" />
        <div className="mt-6 flex items-center gap-3">
          <VisualMark label={shop.name} stored={shop.emoji} size="xl" />
          <div>
            <h1 className="font-display text-2xl">{shop.name}</h1>
            <p className="text-sm font-semibold text-white/70">
              {CATEGORY_LABELS[shop.category]} · {shop.address}, Villeneuve
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold text-white/80">
          Offres du jour — réservez, retirez ici.
        </p>
      </header>

      <main className="space-y-4 px-4 py-5">
        {/* Search + Filter bar */}
        {offers.length > 0 && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ec-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher une offre…"
                  className="h-11 w-full rounded-xl border border-ec-rule bg-white pl-10 pr-4 text-sm font-semibold text-ec-ink outline-none placeholder:text-ec-muted focus:border-ec-blue"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-ec-muted" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                  filterType
                    ? "border-ec-blue bg-ec-blue text-white"
                    : "border-ec-rule bg-white text-ec-ink"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Filter chips */}
            {showFilters && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterType(null)}
                  className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                    !filterType
                      ? "bg-ec-ink text-white"
                      : "bg-ec-soft text-ec-muted"
                  }`}
                >
                  Tout
                </button>
                {ALL_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterType(filterType === t ? null : t)}
                    className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                      filterType === t
                        ? "bg-ec-ink text-white"
                        : "bg-ec-soft text-ec-muted"
                    }`}
                  >
                    {OFFER_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            )}

            {/* Active filter indicator */}
            {hasFilters && (
              <p className="text-xs font-semibold text-ec-muted">
                {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
                {filterType && ` · ${OFFER_TYPE_LABELS[filterType]}`}
                {search && ` · "${search}"`}
                <button
                  type="button"
                  onClick={() => { setSearch(""); setFilterType(null); }}
                  className="ml-2 font-extrabold text-ec-blue"
                >
                  Réinitialiser
                </button>
              </p>
            )}
          </div>
        )}

        {/* Offers list */}
        {!loaded ? (
          <>
            <OfferSkeleton />
            <OfferSkeleton />
            <OfferSkeleton />
          </>
        ) : offers.length === 0 ? (
          <div className="ec-corner-cut border border-dashed border-ec-rule bg-ec-surface p-8 text-center">
            <p className="font-extrabold text-ec-ink">
              Pas d&apos;offre publiée pour l&apos;instant
            </p>
            <p className="mt-1 text-sm font-semibold text-ec-muted">
              Revenez plus tard, ou voyez tout Villeneuve.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-extrabold text-ec-blue"
            >
              Voir tout Villeneuve
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="ec-corner-cut border border-dashed border-ec-rule bg-ec-surface p-8 text-center">
            <p className="font-extrabold text-ec-ink">
              Aucun résultat
            </p>
            <p className="mt-1 text-sm font-semibold text-ec-muted">
              Essayez avec d&apos;autres mots-clés ou filtres.
            </p>
            <button
              type="button"
              onClick={() => { setSearch(""); setFilterType(null); }}
              className="mt-4 text-sm font-extrabold text-ec-blue"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          filtered.map((o) => <OfferCard key={o.id} offer={o} shop={shop} />)
        )}

        <Link
          href="/"
          className="block text-center text-sm font-extrabold text-ec-blue"
        >
          Toutes les offres Villeneuve
        </Link>
      </main>
    </div>
  );
}
