import Link from "next/link";
import { ClotureClient } from "./ClotureClient";
import { getOffer, getReservations } from "@/lib/store";

export const dynamic = "force-dynamic";

const DEMO_SHOP = "shop_dasilva";

export default async function ProCloturePage() {
  const all = await getReservations({ shopId: DEMO_SHOP });
  const confirmed = await Promise.all(
    all
      .filter((r) => r.status === "CONFIRMEE")
      .map(async (r) => ({ ...r, offer: await getOffer(r.offerId) }))
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-5 lg:max-w-3xl">
      <div className="mb-5">
        <p className="text-xs font-extrabold uppercase tracking-wide text-ec-muted">
          Da Silva · Fin de journée
        </p>
        <h1 className="font-display text-[1.75rem] text-ec-ink">Clôture</h1>
        <p className="text-sm font-semibold text-ec-muted">
          {confirmed.length} confirmée
          {confirmed.length !== 1 ? "s" : ""} sans retrait scanné
        </p>
      </div>

      <ClotureClient initial={confirmed} shopId={DEMO_SHOP} />

      <Link
        href="/pro"
        className="mt-6 block text-center text-sm font-extrabold text-ec-blue"
      >
        ← Retour inbox
      </Link>
    </div>
  );
}
