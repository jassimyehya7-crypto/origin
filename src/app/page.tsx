import { BottomNav } from "@/components/client/BottomNav";
import { CategoryMenu } from "@/components/client/CategoryMenu";
import { HeaderLocation } from "@/components/client/HeaderLocation";
import { LocationOfferFeed } from "@/components/client/LocationOfferFeed";
import { ScrollHideOnDown } from "@/components/client/ScrollHideOnDown";
import { ClientLocationProvider } from "@/hooks/useClientLocation";
import { LiveRefresh } from "@/hooks/useLiveRefresh";
import { Logo } from "@/components/Logo";
import { getOffers, getShops } from "@/lib/store";
import type { ShopCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

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

  const preferredOrder = ["demo_pain", "demo_brush", "demo_tomates", "demo_snacks", "demo_tomme"];
  offers.sort((a, b) => {
    const ai = preferredOrder.indexOf(a.id);
    const bi = preferredOrder.indexOf(b.id);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
  });

  const shopMap = Object.fromEntries(shops.map((s) => [s.id, s]));
  const shopGeo = shops.map((s) => ({
    id: s.id,
    city: s.city,
    lat: s.lat,
    lng: s.lng,
  }));

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-ec-paper">
      <LiveRefresh types={["offers", "shops"]} toast={false} />
      <ClientLocationProvider shops={shopGeo}>
        <header className="sticky top-0 z-30 bg-white px-4 pb-3 pt-5">
          <div className="flex items-center justify-between gap-3">
            <Logo size="lg" />
            <HeaderLocation />
          </div>
        </header>

        <main className="safe-pb px-4 pt-1">

          {/* Chips : visibles seulement en haut de page */}
          <ScrollHideOnDown className="-mx-4 mb-5 overflow-hidden bg-white px-4 pb-3 pt-2">
            <CategoryMenu active={cat} query={q} />
          </ScrollHideOnDown>

          <h1 className="mb-2 text-[1.7rem] font-black tracking-tight text-[#09152d]">Offres autour de vous</h1>

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
