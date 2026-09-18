import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PRO_SHOP_ID } from "@/lib/pro-shop";
import { ensureShopDayClosed, getOffers } from "@/lib/store";
import { zurichParts } from "@/lib/utils";
import type { Offer } from "@/lib/types";
import { OffresToast } from "./OffresToast";
import { OffersList } from "./OffersList";

export const dynamic = "force-dynamic";

function isTodayZurich(iso?: string): boolean {
  if (!iso) return false;
  const today = zurichParts().dateKey;
  return zurichParts(new Date(iso)).dateKey === today;
}

function proListOffers(all: Offer[]): Offer[] {
  return all
    .filter((o) => {
      // Seules les offres publiées et brouillons apparaissent
      // Les offres terminées/expirées disparaissent complètement
      return o.status === "PUBLIEE" || o.status === "BROUILLON";
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt || b.createdAt).getTime() -
        new Date(a.publishedAt || a.createdAt).getTime()
    );
}

export default async function ProOffresPage() {
  await ensureShopDayClosed(PRO_SHOP_ID);
  const offers = proListOffers(
    (await getOffers()).filter((o) => o.shopId === PRO_SHOP_ID)
  );

  return (
    <div className="mx-auto max-w-2xl px-5 py-5">
      <Suspense fallback={null}>
        <OffresToast />
      </Suspense>

      <OffersList initialOffers={offers} />

      <Link
        href="/pro/offres/nouvelle"
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ec-yellow text-base font-extrabold text-ec-ink shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
        Ajouter une offre
      </Link>
    </div>
  );
}
