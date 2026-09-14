import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Clock } from "lucide-react";
import { BottomNav } from "@/components/client/BottomNav";
import { LiveRefresh } from "@/hooks/useLiveRefresh";
import { ReservationStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { CancelReservationButton } from "@/components/client/CancelReservationButton";
import { getOffer, getReservation, getShop } from "@/lib/store";
import { formatCHF, formatTime } from "@/lib/utils";
import { VisualMark } from "@/components/VisualMark";
import { offerPhoto } from "@/lib/offer-photos";
import { formatSwissPhoneDisplay } from "@/lib/phone";
import { RESERVATION_STATUS_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const reservation = await getReservation(params.id);
  if (!reservation) notFound();
  const offer = await getOffer(reservation.offerId);
  const shop = await getShop(reservation.shopId);
  if (!offer || !shop) notFound();

  const confirmed = ["CONFIRMEE", "RECUPEREE"].includes(reservation.status);
  const pending = reservation.status === "EN_ATTENTE";
  const photo = offerPhoto(offer.title);
  const phoneDisplay = reservation.clientPhone
    ? formatSwissPhoneDisplay(reservation.clientPhone)
    : "";

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-ec-paper">
      <LiveRefresh types={["reservations", "offers"]} />
      <main className="safe-pb px-4 pt-8">
        {/* Ticket — fine 4px yellow band top only (no check) */}
        <div className="ec-corner-cut-lg ec-corner-cut overflow-hidden border border-ec-rule bg-ec-surface">
          <div className="h-1 w-full bg-ec-yellow" aria-hidden />

          <div className="p-6 text-center">
            {photo ? (
              <div className="relative mx-auto mb-5 h-36 w-full max-w-[280px] overflow-hidden bg-ec-soft">
                <Image
                  src={photo}
                  alt={offer.title}
                  fill
                  className="object-cover"
                  sizes="280px"
                  priority
                />
              </div>
            ) : (
              <div className="mx-auto mb-5 flex justify-center">
                <VisualMark label={offer.title} stored={offer.emoji} size="lg" />
              </div>
            )}

            <h1 className="font-display text-[1.75rem] text-ec-ink">
              {pending
                ? "Demande envoyée"
                : confirmed
                  ? "Réservation confirmée"
                  : "Statut mis à jour"}
            </h1>
            <p className="mt-2 text-sm font-semibold text-ec-muted">
              {pending
                ? "En attente du commerce. Garde ton code pour le retrait."
                : confirmed
                  ? "Présente ton code en magasin pour récupérer ta commande."
                  : "Consulte le détail ci-dessous."}
            </p>

            {/* Big EC code — Encre mono XL, Papier, bordure tiretée Règle */}
            <div className="mt-6 inline-flex w-full max-w-sm flex-col items-center border-2 border-dashed border-ec-rule bg-ec-paper px-6 py-5">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-ec-muted">
                Code de retrait
              </span>
              <span className="mt-2 font-mono text-4xl font-black tracking-wider text-ec-ink sm:text-5xl">
                {reservation.code}
              </span>
            </div>

            {phoneDisplay ? (
              <p className="mt-4 text-sm font-bold text-ec-ink">
                SMS envoyé au {phoneDisplay}
              </p>
            ) : null}

            <div className="mt-5">
              {pending ? (
                <span className="inline-flex items-center border border-ec-rule bg-ec-soft px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-ec-ink">
                  {RESERVATION_STATUS_LABELS.EN_ATTENTE}
                </span>
              ) : (
                <ReservationStatusBadge status={reservation.status} />
              )}
            </div>
          </div>
        </div>

        <div className="ec-corner-cut mt-4 space-y-3 border border-ec-rule bg-ec-surface p-4">
          <div className="flex items-start gap-3">
            {photo ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-ec-soft">
                <Image
                  src={photo}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            ) : (
              <VisualMark label={offer.title} stored={offer.emoji} size="md" />
            )}
            <div className="flex-1 text-left">
              <div className="font-extrabold text-ec-ink">{offer.title}</div>
              <div className="text-sm font-semibold text-ec-muted">
                {reservation.quantity} × {offer.unit} ·{" "}
                {formatCHF(offer.price * reservation.quantity)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-ec-muted">
            <MapPin className="h-4 w-4 text-ec-blue" />
            {shop.name} · {shop.address}, Villeneuve
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-ec-muted">
            <Clock className="h-4 w-4 text-ec-green" />
            À retirer aujourd&apos;hui avant {formatTime(offer.validUntil)}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <CancelReservationButton
            reservationId={reservation.id}
            status={reservation.status}
          />
          <Link href="/reservations">
            <Button full size="lg" variant="confirm" className="rounded-none">
              Mes réservations
            </Button>
          </Link>
          <Link href="/">
            <Button full variant="outline" className="mt-3 rounded-none">
              Autres offres
            </Button>
          </Link>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
