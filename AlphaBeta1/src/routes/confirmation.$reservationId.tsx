import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus, Navigation } from "lucide-react";
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
  const cancelled = reservation.status === "cancelled" || reservation.status === "refused";

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
                ? "En attente du commerce. Garde ton code pour le retrait."
                : confirmed
                  ? "Présente ton code en magasin pour récupérer ta commande."
                  : cancelled
                    ? "Le stock a été remis à disposition."
                    : "Consulte le détail ci-dessous."}
            </p>
            <CopyableCode code={reservation.code} />
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
