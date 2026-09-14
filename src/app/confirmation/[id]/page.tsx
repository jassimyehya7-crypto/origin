import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MapPin, Clock } from "lucide-react";
import { BottomNav } from "@/components/client/BottomNav";
import { LiveRefresh } from "@/hooks/useLiveRefresh";
import { ReservationStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { CancelReservationButton } from "@/components/client/CancelReservationButton";
import { getOffer, getReservation, getShop } from "@/lib/store";
import { formatCHF, formatTime } from "@/lib/utils";
import { VisualMark } from "@/components/VisualMark";

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

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-ec-paper">
      <LiveRefresh types={["reservations", "offers"]} />
      <main className="safe-pb px-4 pt-10">
        <div className="ec-corner-cut-lg ec-corner-cut border border-ec-rule bg-ec-surface p-6 text-center">
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
              pending
                ? "bg-ec-soft"
                : confirmed
                  ? "bg-ec-yellow"
                  : "bg-ec-red/10"
            }`}
          >
            <Check
              className={`h-8 w-8 ${
                pending
                  ? "text-ec-ink"
                  : confirmed
                    ? "text-ec-ink"
                    : "text-ec-red"
              }`}
              strokeWidth={3}
            />
          </div>
          <h1 className="font-display text-[1.75rem] text-ec-ink">
            {pending
              ? "Demande envoyée — en attente du commerce"
              : confirmed
                ? "Réservation confirmée"
                : "Statut mis à jour"}
          </h1>
          <p className="mt-2 text-sm font-semibold text-ec-muted">
            {pending
              ? "Pas encore confirmée. Le commerçant va accepter ou refuser. Gardez votre code EC pour le retrait."
              : confirmed
                ? "Présentez votre code en magasin pour récupérer votre commande."
                : "Consultez le détail ci-dessous."}
          </p>

          <div className="mt-5 inline-flex flex-col items-center rounded-[16px] border-2 border-dashed border-ec-rule bg-ec-paper px-6 py-4">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-ec-muted">
              Code de retrait
            </span>
            <span className="mt-1 font-mono text-3xl font-black tracking-wider text-ec-ink">
              {reservation.code}
            </span>
          </div>

          <div className="mt-4">
            <ReservationStatusBadge status={reservation.status} />
          </div>
        </div>

        <div className="ec-corner-cut mt-4 space-y-3 border border-ec-rule bg-ec-surface p-4">
          <div className="flex items-start gap-3">
            <VisualMark label={offer.title} stored={offer.emoji} size="md" />
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
            <Button full size="lg" variant="confirm">
              Voir mes réservations
            </Button>
          </Link>
          <Link href="/">
            <Button full variant="outline" className="mt-3">
              Retour aux offres
            </Button>
          </Link>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
