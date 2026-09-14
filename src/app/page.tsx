import Link from "next/link";
import { LocateFixed } from "lucide-react";
import { BottomNav } from "@/components/client/BottomNav";
import { RiskBanner } from "@/components/client/RiskBanner";
import { LiveRefresh } from "@/hooks/useLiveRefresh";
import { Logo } from "@/components/Logo";
import { OfferCard } from "@/components/OfferCard";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/labels";
import { getOffers, getShops } from "@/lib/store";
import type { ShopCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORIES: (ShopCategory | "all")[] = [
  "all",
  "epicerie",
  "boulangerie",
  "kiosque",
  "cremiere",
  "autre",
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: { cat?: string; q?: string };
}) {
  const shops = (await getShops()).filter((s) => s.published);
  const cat = (searchParams.cat as ShopCategory | "all") || "all";
  const q = (searchParams.q || "").toLowerCase().trim();

  let offers = await getOffers({ publishedOnly: true });
  if (cat !== "all") {
    const ids = new Set(shops.filter((s) => s.category === cat).map((s) => s.id));
    offers = offers.filter((o) => ids.has(o.shopId));
  }
  if (q) {
    offers = offers.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        shops.find((s) => s.id === o.shopId)?.name.toLowerCase().includes(q)
    );
  }

  const shopMap = Object.fromEntries(shops.map((s) => [s.id, s]));

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-ec-paper">
      <LiveRefresh />
      <header className="sticky top-0 z-30 border-b border-ec-rule bg-ec-paper/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Logo size="sm" />
          <div className="flex items-center gap-1.5 rounded-[12px] px-2.5 py-1.5 text-xs font-bold text-ec-ink">
            <LocateFixed className="h-4 w-4 text-ec-blue" />
            <span className="leading-tight">
              Villeneuve
              <span className="block text-[10px] font-semibold text-ec-muted">
                VD
              </span>
            </span>
          </div>
        </div>
      </header>

      <main className="safe-pb px-4 pt-4">
        <RiskBanner />
        {/* Hero compressé — une ligne */}
        <p className="mb-3 text-sm font-extrabold text-ec-ink">
          Aujourd&apos;hui à Villeneuve · {offers.length} offre
          {offers.length !== 1 ? "s" : ""}
        </p>

        {/* Chips secondaires sticky légères */}
        <div className="sticky top-[3.75rem] z-20 -mx-4 mb-4 border-b border-ec-rule/60 bg-ec-paper/95 px-4 py-2 backdrop-blur">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-0.5">
            {CATEGORIES.map((c) => {
              const active = cat === c;
              const href =
                c === "all"
                  ? q
                    ? `/?q=${encodeURIComponent(q)}`
                    : "/"
                  : `/?cat=${c}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
              return (
                <Link
                  key={c}
                  href={href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-extrabold transition ${
                    active
                      ? "border-ec-ink bg-ec-ink text-white"
                      : "border-ec-rule bg-ec-surface text-ec-ink"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`inline-flex h-5 w-5 items-center justify-center text-[10px] font-black ${
                      active ? "text-ec-yellow" : "text-ec-ink"
                    }`}
                  >
                    {c === "all" ? "T" : CATEGORY_ICONS[c]}
                  </span>
                  {c === "all" ? "Tout" : CATEGORY_LABELS[c]}
                </Link>
              );
            })}
          </div>
        </div>

        {offers.length === 0 ? (
          <div className="ec-corner-cut border border-dashed border-ec-rule bg-ec-surface px-6 py-12 text-center">
            <p className="font-display text-lg text-ec-ink">
              Rien pour ce filtre
            </p>
            <p className="mt-1 text-sm text-ec-muted">
              Changez de catégorie, ou revenez plus tard.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-extrabold text-ec-blue"
            >
              Voir tout
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                shop={shopMap[offer.shopId]}
              />
            ))}
          </div>
        )}

        <p className="pb-4 pt-8 text-center text-[11px] font-semibold text-ec-muted">
          Réservation gratuite · Pas de paiement en ligne · Retrait en magasin
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
