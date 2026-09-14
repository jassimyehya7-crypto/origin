import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, PackageCheck } from "lucide-react";
import { OfferTypeBadge } from "./StatusBadge";
import { VisualMark } from "./VisualMark";
import type { Offer, Shop } from "@/lib/types";
import {
  discountPercent,
  formatCHF,
  formatTime,
  formatWalkDistance,
} from "@/lib/utils";
import { offerPhoto } from "@/lib/offer-photos";

function priceMeta(offer: Offer) {
  const disc = discountPercent(offer.price, offer.originalPrice);
  if (disc !== null) {
    return {
      primary: `-${disc}% · ${formatCHF(offer.price)}`,
      struck: offer.originalPrice != null ? formatCHF(offer.originalPrice) : null,
    };
  }
  return { primary: formatCHF(offer.price), struck: null };
}

export function OfferCard({
  offer,
  shop,
}: {
  offer: Offer;
  shop?: Shop | null;
}) {
  const photo = offerPhoto(offer);
  const price = priceMeta(offer);
  const available = offer.status === "PUBLIEE" && offer.quantityLeft > 0;
  const href = `/offre/${offer.id}`;
  const distance = shop ? formatWalkDistance(shop.lat, shop.lng) : null;

  return (
    <article className="ec-corner-cut overflow-hidden border border-ec-rule bg-ec-surface">
      {/* Un seul lien = un seul hit-target (évite ratés / mauvaise offre) */}
      <Link
        href={href}
        prefetch
        scroll
        className="block touch-manipulation active:opacity-95"
      >
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-ec-soft">
          {photo ? (
            <Image
              src={photo}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 512px) 100vw, 512px"
              priority={false}
            />
          ) : (
            <VisualMark label={offer.title} stored={offer.emoji} size="hero" />
          )}
          <div className="absolute left-3 top-3">
            <OfferTypeBadge type={offer.type} />
          </div>
          {offer.status === "EPUISEE" && (
            <span className="absolute inset-0 flex items-center justify-center bg-ec-ink/40 text-sm font-bold uppercase tracking-wide text-white">
              Épuisée
            </span>
          )}
        </div>

        <div className="space-y-2.5 px-4 pt-4">
          <div>
            <p className="font-display text-[1.65rem] leading-[1.05] text-ec-ink">
              {offer.title}
            </p>
            <p className="mt-1 text-sm font-bold text-ec-muted">
              <span className={price.struck ? "text-ec-red" : "text-ec-ink"}>
                {price.primary}
              </span>
              {price.struck && (
                <span className="ml-2 font-semibold text-ec-muted line-through">
                  {price.struck}
                </span>
              )}
            </p>
            {shop && (
              <p className="mt-1 truncate text-xs font-semibold text-ec-muted">
                {shop.name}
              </p>
            )}
          </div>

          {distance && (
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-ec-blue">
              <MapPin className="h-3.5 w-3.5" />
              {distance}
              {shop?.address ? (
                <span className="font-semibold text-ec-muted">
                  · {shop.address}
                </span>
              ) : null}
            </p>
          )}

          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ec-muted">
            <Clock className="h-3.5 w-3.5 text-ec-green" />
            Jusqu&apos;à {formatTime(offer.validUntil)}
          </p>

          {available && (
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ec-muted">
              <PackageCheck className="h-3.5 w-3.5 text-ec-green" />
              Encore {offer.quantityLeft}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center px-4 pb-4 pt-3">
          {available ? (
            <span className="inline-flex w-full max-w-sm items-center justify-center bg-ec-yellow px-6 py-3 text-sm font-extrabold text-ec-ink">
              Réserver
            </span>
          ) : (
            <span className="inline-flex w-full max-w-sm items-center justify-center bg-ec-rule px-6 py-3 text-sm font-extrabold text-ec-muted">
              Indisponible
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
