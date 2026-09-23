import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus, Check, Navigation } from "lucide-react";
import { PageShell } from "@/components/back-header";
import { CopyableCode } from "@/components/copyable-code";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { chf, distLabel, walkMinutes } from "@/lib/format";
import { RESERVATION_STATUS_LABELS } from "@/lib/labels";
import { extraMeters } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/confirmation/$reservationId")({
  component: Confirmation,
});

function Confirmation() {
  const { reservationId } = Route.useParams();
  const reservation = useAppStore((s) => s.reservations.find((r) => r.id === reservationId));
  const locationId = useAppStore((s) => s.locationId);

  if (!reservation) {
    return (
      <PageShell>
        <div className="p-8 text-center">
          <p className="text-sm text-mute">Réservation introuvable.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/">Retour à l’accueil</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const distance = reservation.distanceM + extraMeters(locationId);
  const maps = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(reservation.address)}`;
  const pending = reservation.status === "pending";
  const confirmed = reservation.status === "confirmed" || reservation.status === "picked";
  const picked = reservation.status === "picked";
  const cancelled = reservation.status === "cancelled" || reservation.status === "refused";

  if (picked) {
    return <PickupSuccess reservation={reservation} />;
  }

  function addToCalendar() {
    const today = new Date();
    const [h, m] = reservation!.until.split(":").map(Number);
    const end = new Date(today);
    end.setHours(h, m, 0, 0);
    const start = new Date(end.getTime() - 30 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:Retirer ${reservation!.title} — ${reservation!.merchantName} (${reservation!.code})`,
      `LOCATION:${reservation!.address}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "offreslocal.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell>
      <div className="flex min-h-dvh flex-col items-center px-5 pb-10 pt-10 text-center">
        <div className="w-full overflow-hidden rounded-[var(--radius-lg)] border border-line bg-card text-left shadow-[var(--shadow-card)]">
          <div className="h-1 w-full bg-lime" aria-hidden />
          <div className="p-6 text-center">
            <Photo
              src={reservation.image}
              alt=""
              className="mx-auto mb-5 h-36 w-full max-w-[280px] rounded-[var(--radius-sm)]"
            />
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
              {pending
                ? "Demande envoyée"
                : confirmed
                  ? "Réservation confirmée"
                  : cancelled
                    ? "Réservation annulée"
                    : "Statut mis à jour"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-mute">
              {pending
                ? "En attente de la confirmation du commerce. Tu recevras un SMS de confirmation fictif avec ton code de retrait."
                : confirmed
                  ? "Ton SMS de confirmation fictif est prêt. Présente ce code en magasin pour récupérer ta commande."
                  : cancelled
                    ? "Le stock a été remis à disposition."
                    : "Consulte le détail ci-dessous."}
            </p>
            {pending ? (
              <div className="mt-6 rounded-[var(--radius-md)] bg-soft px-4 py-4 text-left text-xs text-mute">
                <p className="font-bold text-ink">SMS fictif en attente</p>
                <p className="mt-1">Le code sera affiché ici dès que le commerçant aura confirmé la réservation.</p>
              </div>
            ) : confirmed ? (
              <>
                <div className="mt-5 rounded-[var(--radius-md)] bg-lime/25 px-4 py-3 text-left text-xs">
                  <p className="font-bold text-ink">SMS fictif envoyé</p>
                  <p className="mt-1 text-mute">Réservation confirmée · code de retrait {reservation.code}</p>
                </div>
                <CopyableCode code={reservation.code} />
              </>
            ) : null}
            <p className="mt-4 inline-flex items-center rounded-full bg-soft px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-ink">
              {RESERVATION_STATUS_LABELS[reservation.status]}
            </p>
          </div>
        </div>

        <div className="mt-4 w-full rounded-[var(--radius-lg)] bg-card p-4 text-left shadow-[var(--shadow-card)]">
          <div className="flex gap-3">
            <Photo src={reservation.image} alt="" className="size-16 rounded-[var(--radius-sm)]" />
            <div>
              <h2 className="font-display text-lg font-semibold">{reservation.title}</h2>
              <p className="text-sm text-mute">{reservation.merchantName}</p>
              <p className="mt-1 font-bold tabular">
                {reservation.qty} × {reservation.unit ?? "pièce"} · {chf(reservation.unitPrice * reservation.qty)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm">À retirer avant {reservation.until}</p>
          <p className="text-sm text-mute">
            {reservation.address} · {distLabel(distance)} · {walkMinutes(distance)} min à pied
          </p>
        </div>

        <div className="mt-5 grid w-full grid-cols-2 gap-2">
          <Button asChild variant="outline">
            <a href={maps} target="_blank" rel="noreferrer">
              <Navigation className="size-4" />
              Itinéraire
            </a>
          </Button>
          <Button variant="outline" onClick={addToCalendar}>
            <CalendarPlus className="size-4" />
            Calendrier
          </Button>
        </div>

        <Button asChild variant="ink" size="lg" className="mt-8">
          <Link to="/reservations">Mes réservations</Link>
        </Button>
        <Button asChild variant="outline" className="mt-2">
          <Link to="/">Autres offres</Link>
        </Button>
      </div>
    </PageShell>
  );
}

function PickupSuccess({ reservation }: { reservation: NonNullable<ReturnType<typeof useAppStore.getState>["reservations"][number]> }) {
  return (
    <PageShell>
      <div className="flex min-h-dvh flex-col items-center justify-center bg-lime px-6 text-center text-ink">
        <div className="grid size-32 place-items-center rounded-full border-4 border-ink">
          <Check className="size-20" strokeWidth={2.5} />
        </div>
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight">Commande bien récupérée</h1>
        <p className="mt-3 max-w-xs text-base font-semibold leading-relaxed">Merci pour votre confiance.</p>
        <p className="mt-2 text-sm text-ink/70">{reservation.title} · {reservation.merchantName}</p>
        <Link to="/reservations" className="mt-10 inline-flex h-12 items-center rounded-[var(--radius-md)] bg-white px-6 text-sm font-bold text-ink shadow-[var(--shadow-card)]">
          Voir mes réservations
        </Link>
      </div>
    </PageShell>
  );
}
