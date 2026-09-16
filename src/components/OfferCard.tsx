import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { VisualMark } from "./VisualMark";
import type { Offer, Shop } from "@/lib/types";
import { discountPercent, formatCHF } from "@/lib/utils";
import { offerPhoto } from "@/lib/offer-photos";
import { isPrototypeOffer } from "@/lib/prototype";

export function OfferCard({ offer, shop }: { offer: Offer; shop?: Shop | null }) {
  const photo = offerPhoto(offer);
  const available = offer.status === "PUBLIEE" && offer.quantityLeft > 0;
  const disc = discountPercent(offer.price, offer.originalPrice);
  const prototype = isPrototypeOffer(offer);
  const stockWidth = Math.max(8, Math.min(100, offer.quantityLeft * 9));

  return (
    <article className="border-b border-ec-rule bg-white py-2.5">
      <Link href={`/offre/${offer.id}`} className="grid grid-cols-[132px_1fr] gap-3 active:opacity-90">
        <div className="relative flex h-[105px] items-center justify-center overflow-hidden rounded-lg bg-ec-soft">
          {photo ? <Image src={photo} alt="" fill className="object-cover" sizes="132px" /> : <VisualMark label={offer.title} stored={offer.emoji} size="hero" />}
          {disc !== null ? <span className="absolute left-0 top-0 bg-rose-500 px-2 py-1 text-xs font-black text-white">-{disc}%</span> : null}
        </div>
        <div className="relative min-w-0 pr-1">
          <Heart className="absolute right-0 top-0 h-4 w-4 text-ec-muted" />
          <h2 className="truncate pr-6 text-sm font-black text-ec-ink">{offer.title}</h2>
          <p className="truncate text-[10px] font-semibold text-ec-muted">{shop?.name}</p>
          <p className="mt-1 text-sm font-black text-rose-500">{formatCHF(offer.price)}{offer.originalPrice ? <span className="ml-2 text-[10px] font-semibold text-ec-muted line-through">{formatCHF(offer.originalPrice)}</span> : null}</p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-rose-100"><div className="h-full bg-rose-500" style={{ width: `${stockWidth}%` }} /></div>
          <div className="mt-1 flex items-center justify-between gap-2 text-[9px] font-bold"><span className="shrink-0 rounded-sm bg-rose-500 px-3 py-1 text-white">{offer.quantityLeft} dispo</span><span className="truncate text-ec-muted">Plus que {offer.quantityLeft} disponibles !</span></div>
          <span className={`mt-1.5 inline-flex w-full items-center justify-center rounded-sm py-1.5 text-[11px] font-black ${available ? "bg-ec-yellow text-ec-ink" : "bg-ec-rule text-ec-muted"}`}>{available ? (prototype ? "Voir la démo" : "Réserver →") : "Indisponible"}</span>
        </div>
      </Link>
    </article>
  );
}
