import Link from "next/link";
import { BottomNav } from "@/components/client/BottomNav";
import { HeaderLocation } from "@/components/client/HeaderLocation";
import { LocationOfferFeed } from "@/components/client/LocationOfferFeed";
import { NearestCoverageBanner } from "@/components/client/NearestCoverageBanner";
import { RiskBanner } from "@/components/client/RiskBanner";
import { ScrollHideOnDown } from "@/components/client/ScrollHideOnDown";
import { TodayInCity } from "@/components/client/TodayInCity";
import { ClientLocationProvider } from "@/hooks/useClientLocation";
import { LiveRefresh } from "@/hooks/useLiveRefresh";
import { Logo } from "@/components/Logo";
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
  const shopGeo = shops.map((s) => ({
    id: s.id,
    city: s.city,
    lat: s.lat,
    lng: s.lng,
  }));

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-ec-paper">
      <LiveRefresh />
      <ClientLocationProvider shops={shopGeo}>
        <header className="sticky top-0 z-30 border-b border-ec-rule bg-ec-paper/95 px-4 pb-3 pt-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <Logo size="sm" />
            <HeaderLocation />
          </div>
        </header>

        <main className="safe-pb px-4 pt-4">
          <RiskBanner />
          <TodayInCity />
          <NearestCoverageBanner />

          {/* Chips : visibles seulement en haut de page */}
          <ScrollHideOnDown className="-mx-4 mb-4 overflow-hidden border-b border-ec-rule/60 bg-ec-paper px-4 py-2">
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
          </ScrollHideOnDown>

          <LocationOfferFeed offers={offers} shopMap={shopMap} />

          <p className="pb-4 pt-8 text-center text-[11px] font-semibold text-ec-muted">
            Réservation gratuite · Pas de paiement en ligne · Retrait en magasin
          </p>
        </main>
      </ClientLocationProvider>

      <BottomNav />
    </div>
  );
}
