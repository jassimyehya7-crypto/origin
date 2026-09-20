import { createFileRoute, Link } from "@tanstack/react-router";
import { Navigation } from "lucide-react";
import { toast } from "sonner";
import { BackCircle, PageShell } from "@/components/back-header";
import { CopyableCode } from "@/components/copyable-code";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { chf, distLabel } from "@/lib/format";
import { RESERVATION_STATUS_LABELS } from "@/lib/labels";
import { extraMeters } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/reservations/$reservationId")({
  component: ReservationDetail,
});

function ReservationDetail() {
  const { reservationId } = Route.useParams();
  const reservation = useAppStore((s) => s.reservations.find((r) => r.id === reservationId));
  const cancel = useAppStore((s) => s.cancelReservation);
  const locationId = useAppStore((s) => s.locationId);

  if (!reservation) {
    return (
      <PageShell>
        <div className="p-6">
          <BackCircle />
          <p className="mt-8 text-sm text-mute">Réservation introuvable.</p>
        </div>
      </PageShell>
    );
  }

  const distance = reservation.distanceM + extraMeters(locationId);
  const maps = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(reservation.address)}`;
  const canCancel = reservation.status === "pending" || reservation.status === "confirmed";

  return (
    <PageShell>
      <header className="flex items-center gap-3 px-5 pb-3 pt-5 safe-top">
        <BackCircle />
        <h1 className="font-display text-lg font-semibold">Réservation</h1>
      </header>
      <div className="px-5 pb-10">
        <Photo src={reservation.image} alt={reservation.title} className="h-48 w-full rounded-[var(--radius-lg)]" />
        <h2 className="mt-4 font-display text-2xl font-bold">{reservation.title}</h2>
        <p className="text-sm text-mute">{reservation.merchantName}</p>
        <p className="mt-2 text-xl font-bold tabular">{chf(reservation.unitPrice * reservation.qty)}</p>
        <p className="mt-1 text-sm">Quantité : {reservation.qty} {reservation.unit ?? ""}</p>
        <p className="text-sm text-mute">À retirer avant {reservation.until}</p>
        <p className="text-sm text-mute">
          {reservation.address} · {distLabel(distance)}
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-mute">
          {RESERVATION_STATUS_LABELS[reservation.status]}
        </p>

        <CopyableCode code={reservation.code} />

        <Button asChild variant="outline" className="mt-6 w-full">
          <a href={maps} target="_blank" rel="noreferrer">
            <Navigation className="size-4" />
            Voir l’itinéraire
          </a>
        </Button>
        <Button asChild variant="ghost" className="mt-2 w-full">
          <Link to="/offers/$offerId" params={{ offerId: reservation.offerId }}>
            Voir l’offre
          </Link>
        </Button>
        {canCancel ? (
          <Button
            variant="soft"
            className="mt-2 w-full"
            onClick={() => {
              cancel(reservation.id);
              toast("Réservation annulée");
            }}
          >
            Annuler la réservation
          </Button>
        ) : null}
      </div>
    </PageShell>
  );
}
