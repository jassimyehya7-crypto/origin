"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3, Heart } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Offer, Shop } from "@/lib/types";
import { discountPercent, formatCHF } from "@/lib/utils";
import { offerPhoto } from "@/lib/offer-photos";
import { VisualMark } from "@/components/VisualMark";
import { OfferTimeRemaining } from "@/components/OfferTimeRemaining";
import { useClientLocation } from "@/hooks/useClientLocation";

type BestOffersProps = {
  offers: Offer[];
  shopMap: Record<string, Shop>;
};

/** Picks the strongest visible deals without any manual curation. */
export function BestOffers({ offers, shopMap }: BestOffersProps) {
  const { status, feedShopIds } = useClientLocation();
  const nearbyOffers = status === "loading" && feedShopIds.size === 0
    ? offers
    : feedShopIds.size > 0
      ? offers.filter((offer) => feedShopIds.has(offer.shopId))
      : offers;
  const best = [...nearbyOffers]
    .sort((a, b) => {
      const discountA = discountPercent(a.price, a.originalPrice) ?? 0;
      const discountB = discountPercent(b.price, b.originalPrice) ?? 0;
      if (discountB !== discountA) return discountB - discountA;
      const savingA = (a.originalPrice ?? a.price) - a.price;
      const savingB = (b.originalPrice ?? b.price) - b.price;
      if (savingB !== savingA) return savingB - savingA;
      return a.price - b.price;
    })
    .slice(0, 3);

  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || best.length < 2) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    let timer: number | undefined;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        const card = scroller.querySelector<HTMLElement>("[data-best-offer-card]");
        const step = (card?.offsetWidth || 174) + 12;
        const end = scroller.scrollWidth - scroller.clientWidth;
        if (end <= 2) return;
        if (scroller.scrollLeft >= end - 2) {
          scroller.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scroller.scrollTo({ left: Math.min(end, scroller.scrollLeft + step), behavior: "smooth" });
        }
      }, 3500);
    };
    const stop = () => window.clearInterval(timer);

    start();
    scroller.addEventListener("pointerenter", stop);
    scroller.addEventListener("pointerleave", start);
    scroller.addEventListener("focusin", stop);
    scroller.addEventListener("focusout", start);
    return () => {
      stop();
      scroller.removeEventListener("pointerenter", stop);
      scroller.removeEventListener("pointerleave", start);
      scroller.removeEventListener("focusin", stop);
      scroller.removeEventListener("focusout", start);
    };
  }, [best.length]);

  if (best.length === 0) return null;

  return (
    <section className="mb-6" aria-labelledby="best-offers-title">
      <h2 id="best-offers-title" className="client-title text-center text-[#09152d]">
        Les meilleures offres
      </h2>

      <div
        ref={scrollerRef}
        className="scrollbar-hide -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1"
        aria-label="Meilleures offres"
      >
        {best.map((offer) => {
          const shop = shopMap[offer.shopId];
          const photo = offerPhoto(offer);
          const discount = discountPercent(offer.price, offer.originalPrice);
          const stockWidth = Math.max(15, Math.min(100, offer.quantityLeft * 9));
          return (
            <Link
              key={offer.id}
              href={`/offre/${offer.id}`}
              data-best-offer-card
              className="relative flex w-[174px] shrink-0 flex-col overflow-hidden rounded-[12px] border border-[#e7e9ec] bg-white shadow-[0_4px_14px_rgba(17,24,32,0.08)] active:scale-[0.98]"
              aria-label={`Voir la meilleure offre ${offer.title}`}
            >
              <div className="relative h-[98px] overflow-hidden bg-ec-soft">
                {photo ? <Image src={photo} alt="" fill sizes="174px" className="object-cover" /> : <div className="flex h-full items-center justify-center"><VisualMark label={offer.title} stored={offer.emoji} size="lg" /></div>}
                {discount !== null ? <span className="absolute left-2 top-2 rounded-[3px] bg-[#ff2033] px-1.5 py-1 text-[11px] font-black text-white">-{discount}%</span> : null}
                <Heart className="absolute right-2 top-2 h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
              </div>
              <div className="flex min-h-[116px] flex-col p-2.5">
                <p className="client-caption truncate text-ec-muted">{shop?.name || "Commerce local"}</p>
                <h3 className="mt-0.5 line-clamp-2 text-[14px] font-black leading-tight text-[#09152d]">{offer.title}</h3>
                <div className="mt-1 flex items-baseline gap-1.5">
                  {offer.originalPrice ? <span className="client-caption text-[#91a0be] line-through">{formatCHF(offer.originalPrice)}</span> : null}
                  <span className="text-[15px] font-black text-[#ff2033]">{formatCHF(offer.price)}</span>
                </div>
                {offer.durationHours ? (
                  <div className="client-caption mt-auto inline-flex items-center gap-1 text-[#ff2033]">
                    <Clock3 className="h-3 w-3" /><OfferTimeRemaining validUntil={offer.validUntil} compact />
                  </div>
                ) : (
                  <div className="mt-auto">
                    <div className="h-2 overflow-hidden bg-[#ffd3d8]">
                      <div className="h-full bg-[#ff2033]" style={{ width: `${stockWidth}%` }} />
                    </div>
                    <p className="client-caption mt-1 truncate text-[#09152d]">Plus que {offer.quantityLeft} disponibles !</p>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
