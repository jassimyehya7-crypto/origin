import { getOffer, getReservations } from "@/lib/store";
import { PRO_SHOP_ID } from "@/lib/pro-shop";
import { ReservationsInbox } from "./ReservationsInbox";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ProReservationsPage() {
  const all = await getReservations({ shopId: PRO_SHOP_ID });
  const enriched = await Promise.all(
    all.map(async (r) => ({ ...r, offer: await getOffer(r.offerId) }))
  );

  return (
    <div className="mx-auto max-w-2xl px-5 py-5">
      <h1 className="font-display text-[1.75rem] leading-tight text-ec-ink">Réservations</h1>
      <p className="mb-5 text-sm font-semibold text-ec-muted">
        {enriched.length} au total · historique complet
      </p>
      <ReservationsInbox initial={enriched} />
    </div>
  );
}
