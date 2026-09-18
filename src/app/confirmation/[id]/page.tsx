import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Clock, CalendarPlus, Share2 } from "lucide-react";
import { BottomNav } from "@/components/client/BottomNav";
import { LiveRefresh } from "@/hooks/useLiveRefresh";
import { ReservationStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { CancelReservationButton } from "@/components/client/CancelReservationButton";
import { CalendarButton, ShareCodeButton } from "@/components/client/ConfirmationActions";
import { CopyableCode } from "@/components/client/CopyableCode";
import { getOffer, getReservation, getShop } from "@/lib/store";
import { formatCHF, formatTime } from "@/lib/utils";
import { VisualMark } from "@/components/VisualMark";
import { offerPhoto } from "@/lib/offer-photos";
import { formatSwissPhoneDisplay } from "@/lib/phone";
import { RESERVATION_STATUS_LABELS } from "@/lib/labels";
import { headers } from "next/headers";
import QRCode from "qrcode";

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
  const cancelled = reservation.status === "ANNULEE";
  const photo = offerPhoto(offer);
  const phoneDisplay = reservation.clientPhone
    ? formatSwissPhoneDisplay(reservation.clientPhone)
    : "";
  const qrActive =
    reservation.status === "CONFIRMEE" &&
    Boolean(reservation.pickupToken) &&
    !reservation.pickupTokenConsumedAt;
  let qrDataUrl: string | null = null;
  if (qrActive && reservation.pickupToken) {
    const h = headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    const protocol = h.get("x-forwarded-proto") || "https";
    const base = host ? `${protocol}://${host}` : "";
    qrDataUrl = await QRCode.toDataURL(
      `${base}/pro/scan/${reservation.pickupToken}`,
      { errorCorrectionLevel: "H", margin: 2, width: 420, color: { dark: "#080808", light: "#ffffff" } }
    );
  }

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
                  : cancelled
                    ? "Réservation annulée"
                    : "Statut mis à jour"}
            </h1>
            <p className="mt-2 text-sm font-semibold text-ec-muted">
              {pending
                ? "En attente du commerce. Garde ton code pour le retrait."
                : confirmed
                  ? "Présente ton code en magasin pour récupérer ta commande."
                  : cancelled
                    ? "Le stock a été remis à disposition."
                    : "Consulte le détail ci-dessous."}
            </p>

            {qrDataUrl ? (
              <div className="mt-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR de retrait à usage unique"
                  className="mx-auto h-64 w-64 bg-white p-2 sm:h-72 sm:w-72"
                />
                <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">
                  À présenter au commerçant · ce QR se désactive au premier scan
                </p>
              </div>
            ) : null}

            {/* Big EC code — Encre mono XL, Papier, bordure tiretée Règle */}
            <CopyableCode code={reservation.code} />

            {phoneDisplay ? (
              <p className="mt-4 text-sm font-bold text-ec-ink">
                SMS envoyé au {phoneDisplay}
              </p>
            ) : null}

            {/* Calendar + Share buttons */}
            <div className="mt-4 flex justify-center gap-2">
              <CalendarButton
                title={offer.title}
                shopName={shop.name}
                shopAddress={shop.address}
                validUntil={offer.validUntil}
                code={reservation.code}
              />
              <ShareCodeButton code={reservation.code} shopName={shop.name} />
            </div>

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
