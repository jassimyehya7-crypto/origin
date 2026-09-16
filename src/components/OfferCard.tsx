import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart } from "lucide-react";
import { VisualMark } from "./VisualMark";
import type { Offer, Shop } from "@/lib/types";
import { discountPercent, formatCHF } from "@/lib/utils";
import { offerPhoto } from "@/lib/offer-photos";

export function OfferCard({ offer }: { offer: Offer; shop?: Shop | null }) {
  const photo = offerPhoto(offer);
  const available = offer.status === "PUBLIEE" && offer.quantityLeft > 0;
  const disc = discountPercent(offer.price, offer.originalPrice);
  const stockWidth = Math.max(15, Math.min(100, offer.quantityLeft * 9));
  const kiosk = offer.id === "demo_snacks";

  return (
    <article className="mb-2 overflow-hidden rounded-[4px] bg-white shadow-[0_4px_18px_rgba(17,24,32,0.08)]">
      <Link href={`/offre/${offer.id}`} className="grid h-[118px] grid-cols-[48%_52%] active:opacity-90">
        <div className="relative flex h-full items-center justify-center overflow-hidden bg-ec-soft">
          {photo ? <Image src={photo} alt="" fill className="object-cover" sizes="240px" /> : <VisualMark label={offer.title} stored={offer.emoji} size="hero" />}
          {disc !== null ? <span className="absolute left-2 top-2 rounded-[2px] bg-[#ff2033] px-2 py-1.5 text-base font-black text-white">-{disc}%</span> : null}
        </div>

        <div className="relative flex min-w-0 flex-col px-2.5 py-2">
          <Heart className="absolute right-2 top-2 h-5 w-5 text-[#09152d]" />
          <h2 className="truncate pr-7 text-[13px] font-black leading-tight text-[#09152d]">{kiosk ? "Sur une sélection de magasins" : offer.title}</h2>
          <div className="mt-1 flex items-baseline gap-3">
            {offer.originalPrice ? <span className="text-[11px] font-bold text-[#91a0be] line-through">{formatCHF(offer.originalPrice)}</span> : null}
            <span className="text-[16px] font-black text-[#ff2033]">{kiosk ? "Dès " : ""}{formatCHF(offer.price)}</span>
          </div>
          <div className="mt-1 grid grid-cols-[38%_1fr] gap-2">
            <span className="flex h-8 items-center justify-center bg-[#ff2033] text-[14px] font-black text-white">{offer.quantityLeft} dispo</span>
            <div className="min-w-0">
              <div className="h-3 overflow-hidden bg-[#ffd3d8]"><div className="h-full bg-[#ff2033]" style={{ width: `${stockWidth}%` }} /></div>
              <p className="mt-1 truncate text-[9px] font-bold text-[#09152d]">Plus que {offer.quantityLeft} disponibles !</p>
            </div>
          </div>
          <span className={`ml-auto mt-1.5 inline-flex h-8 items-center justify-center gap-1.5 rounded-[2px] px-4 text-[13px] font-black ${available ? "bg-ec-yellow text-ec-ink" : "bg-ec-rule text-ec-muted"}`}>
            {available ? "Réserver" : "Indisponible"}<ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </article>
  );
}
