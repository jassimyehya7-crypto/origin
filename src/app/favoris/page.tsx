import Link from "next/link";
import { BottomNav } from "@/components/client/BottomNav";
import { LiveRefresh } from "@/hooks/useLiveRefresh";
import { Logo } from "@/components/Logo";
import { EmptyState } from "@/components/ui/EmptyState";
import { CATEGORY_LABELS } from "@/lib/labels";
import { getFavorites, getOffers, getShop } from "@/lib/store";
import { VisualMark } from "@/components/VisualMark";

export const dynamic = "force-dynamic";

export default async function FavorisPage() {
  const favorites = await getFavorites();
  const rows = (
    await Promise.all(
      favorites.map(async (f) => {
        const shop = await getShop(f.shopId);
        if (!shop) return null;
        const active = (
          await getOffers({ shopId: shop.id, publishedOnly: true })
        ).length;
        return { f, shop, active };
      })
    )
  ).filter(Boolean) as Array<{
    f: (typeof favorites)[number];
    shop: NonNullable<Awaited<ReturnType<typeof getShop>>>;
    active: number;
  }>;

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-ec-paper">
      <LiveRefresh />
      <header className="sticky top-0 z-30 border-b border-ec-rule bg-ec-surface px-4 py-4">
        <Logo size="sm" />
        <h1 className="mt-3 font-display text-2xl text-ec-ink">
          Vos commerces.
        </h1>
        <p className="text-sm font-semibold text-ec-muted">
          Favoris à Villeneuve
        </p>
      </header>
      <main className="safe-pb space-y-3 px-4 pt-4">
        {rows.length === 0 ? (
          <EmptyState
            title="Aucun favori"
            description="Ajoutez un commerce depuis une offre."
          />
        ) : (
          rows.map(({ f, shop, active }) => (
            <Link
              key={f.shopId}
              href={`/q/${shop.slug}`}
              className="ec-corner-cut flex items-center gap-3 border border-ec-rule bg-ec-surface p-4"
            >
              <VisualMark label={shop.name} stored={shop.emoji} size="md" />
              <div className="flex-1">
                <div className="font-extrabold text-ec-ink">{shop.name}</div>
                <div className="text-xs font-semibold text-ec-muted">
                  {CATEGORY_LABELS[shop.category]} · {shop.address}
                </div>
                <div className="mt-1 text-xs font-extrabold text-ec-green">
                  {active} offre{active !== 1 ? "s" : ""} active
                  {active !== 1 ? "s" : ""}
                </div>
              </div>
            </Link>
          ))
        )}
      </main>
      <BottomNav />
    </div>
  );
}
