import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Heart } from "lucide-react";
import { BottomNav } from "@/components/client/BottomNav";
import { LiveRefresh } from "@/hooks/useLiveRefresh";
import { Logo } from "@/components/Logo";
import { EmptyState } from "@/components/ui/EmptyState";
import { CATEGORY_LABELS } from "@/lib/labels";
import { getFavorites, getOffers, getShop } from "@/lib/store";
import { VisualMark } from "@/components/VisualMark";
import { offerPhoto } from "@/lib/offer-photos";
import { UnfavoriteButton } from "./UnfavoriteButton";

export const dynamic = "force-dynamic";

export default async function FavorisPage() {
  const favorites = await getFavorites();
  const rows = (
    await Promise.all(
      favorites
        .slice(0, 50)
        .map(async (f) => {
        const shop = await getShop(f.shopId);
        if (!shop) return null;
        const offers = await getOffers({ shopId: shop.id, publishedOnly: true });
        return { f, shop, active: offers.length, photo: offers[0] ? offerPhoto(offers[0]) : null };
        })
    )
  ).filter(Boolean) as Array<{
    f: (typeof favorites)[number];
    shop: NonNullable<Awaited<ReturnType<typeof getShop>>>;
    active: number;
    photo: string | null;
  }>;

  // Sort: shops with active offers first, then by name
  rows.sort((a, b) => {
    if (a.active > 0 && b.active === 0) return -1;
    if (a.active === 0 && b.active > 0) return 1;
    return a.shop.name.localeCompare(b.shop.name);
  });

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-ec-paper">
      <LiveRefresh />
      <header className="sticky top-0 z-30 bg-white px-4 py-4">
        <Logo size="sm" />
        <h1 className="mt-5 text-center text-2xl font-black text-ec-ink">
          Commerces suivis
        </h1>
        <p className="text-center text-xs font-semibold text-ec-muted">
          Retrouvez ici les commerces que vous suivez.
        </p>
      </header>
      <main className="safe-pb space-y-3 px-4 pt-4">
        {rows.length === 0 ? (
          <EmptyState
            title="Aucun favori"
            description="Ajoutez un commerce depuis une offre."
          />
        ) : (
          rows.map(({ f, shop, active, photo }) => (
            <div
              key={f.shopId}
              className="relative flex items-center gap-3 border-b border-ec-rule bg-white py-3"
            >
              <Link
                href={`/q/${shop.slug}`}
                className="flex flex-1 items-center gap-3"
              >
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-ec-soft">
                  {photo ? <Image src={photo} alt="" fill className="object-cover" sizes="112px" /> : <VisualMark label={shop.name} stored={shop.emoji} size="md" />}
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-ec-ink">{shop.name}</div>
                  <div className="text-xs font-semibold text-ec-muted">
                    {CATEGORY_LABELS[shop.category]} · {shop.address}
                  </div>
                  <div className="mt-2 text-[11px] font-black text-ec-green">
                    {active > 0
                      ? `${active} offre${active !== 1 ? "s" : ""} disponible${active !== 1 ? "s" : ""}`
                      : "Aucune offre active"}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-ec-ink" />
              </Link>
              <UnfavoriteButton shopId={shop.id} />
            </div>
          ))
        )}
      </main>
      <BottomNav />
    </div>
  );
}
