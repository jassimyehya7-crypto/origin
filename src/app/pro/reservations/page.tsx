import { getOffer, getReservations } from "@/lib/store";
import { ReservationsInbox } from "./ReservationsInbox";

export const dynamic = "force-dynamic";

export default async function ProReservationsPage() {
  const all = await getReservations();
  const enriched = await Promise.all(
    all.map(async (r) => ({ ...r, offer: await getOffer(r.offerId) }))
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-5 lg:max-w-3xl">
      <h1 className="font-display text-[1.75rem] text-ec-ink">Réservations</h1>
      <p className="mb-5 text-sm font-semibold text-ec-muted">
        Gros boutons — Confirmer ou Refuser.
      </p>
      <ReservationsInbox initial={enriched} />
    </div>
  );
}
