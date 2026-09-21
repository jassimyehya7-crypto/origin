import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";
import { DiscountBadge } from "@/components/discount-badge";
import { HeartButton } from "@/components/heart-button";
import { Photo } from "@/components/photo";
import { StockBadge } from "@/components/stock-badge";
import { Button } from "@/components/ui/button";
import { getMerchant } from "@/lib/data/catalog";
import { chf, discountPct, distLabel } from "@/lib/format";
import { OFFER_TYPE_LABELS } from "@/lib/labels";
import { useAppStore, useStock } from "@/lib/store";
import { extraMeters } from "@/lib/selectors";
import type { Offer } from "@/lib/types";
import { cn } from "@/lib/utils";

function useOfferMeta(offer: Offer) {
  const merchant = getMerchant(offer.merchantId);
  const locationId = useAppStore((s) => s.locationId);
  const stock = useStock(offer.id, offer.stock);
  const distance = (merchant?.distanceM ?? 0) + extraMeters(locationId);
  const pct = discountPct(offer.originalPrice, offer.price);
  return { merchant, stock, distance, pct };
}

function Prices({
  original,
  price,
  strikeClass = "text-faint",
  priceClass = "text-deal",
}: {
  original?: number;
  price: number;
  strikeClass?: string;
  priceClass?: string;
}) {
  return (
    <p className="flex items-baseline gap-2">
      {original && original > price ? (
        <span className={cn("text-sm line-through tabular", strikeClass)}>{chf(original)}</span>
      ) : null}
      <span className={cn("text-lg font-bold tabular", priceClass)}>{chf(price)}</span>
    </p>
  );
}

export function HotCard({ offer }: { offer: Offer }) {
  const { merchant, stock, distance, pct } = useOfferMeta(offer);
  if (!merchant) return null;
  return (
    <article className="w-[17.5rem] shrink-0 overflow-hidden rounded-[var(--radius-xl)] bg-card shadow-[var(--shadow-card)]">
      <Link to="/offers/$offerId" params={{ offerId: offer.id }} className="block">
        <div className="relative h-44">
          <Photo src={offer.image} alt={offer.title} className="size-full" />
          <DiscountBadge pct={pct} className="absolute left-3 top-3" />
          <HeartButton offerId={offer.id} className="absolute right-3 top-3" />
          <StockBadge stock={stock} className="absolute bottom-3 left-3" />
        </div>
        <div className="space-y-2 p-3.5">
          <p className="text-xs font-medium text-mute">{merchant.name}</p>
          <h3 className="font-display text-lg font-semibold leading-snug tracking-tight">
            {offer.title}
          </h3>
          <Prices original={offer.originalPrice} price={offer.price} />
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-mute">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {distLabel(distance)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> Jusqu’à {offer.until}
            </span>
          </div>
        </div>
      </Link>
      <div className="px-3.5 pb-3.5">
        {stock < 1 ? (
          <Button size="md" className="w-full" disabled>
            Épuisée
          </Button>
        ) : (
          <Button asChild size="md" className="w-full">
            <Link to="/reserve/$offerId" params={{ offerId: offer.id }}>
              Réserver
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}

export function FeedCard({ offer }: { offer: Offer }) {
  const { merchant, stock, distance, pct } = useOfferMeta(offer);
  if (!merchant) return null;
  return (
    <Link
      to="/offers/$offerId"
      params={{ offerId: offer.id }}
      className="block overflow-hidden rounded-[var(--radius-lg)] bg-card shadow-[var(--shadow-card)] press"
    >
      <div className="relative aspect-[4/3]">
        <Photo src={offer.image} alt={offer.title} className="size-full" />
        <DiscountBadge pct={pct} className="absolute left-2.5 top-2.5" />
        <HeartButton offerId={offer.id} className="absolute right-2.5 top-2.5 size-9" />
        <StockBadge stock={stock} className="absolute bottom-2.5 left-2.5" />
      </div>
      <div className="space-y-1 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-mute">{merchant.name}</p>
        <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight">
          {offer.title}
        </h3>
        <Prices original={offer.originalPrice} price={offer.price} />
        <p className="text-xs text-mute">{distLabel(distance)}</p>
      </div>
    </Link>
  );
}

export function NewCard({ offer }: { offer: Offer }) {
  const { merchant, distance, pct } = useOfferMeta(offer);
  if (!merchant) return null;
  return (
    <Link
      to="/offers/$offerId"
      params={{ offerId: offer.id }}
      className="flex w-[15.5rem] shrink-0 gap-3 rounded-[var(--radius-lg)] bg-card p-2 shadow-[var(--shadow-card)] press"
    >
      <Photo
        src={offer.image}
        alt={offer.title}
        className="size-[4.75rem] rounded-[var(--radius-sm)]"
      />
      <div className="min-w-0 flex-1 py-0.5">
        <DiscountBadge pct={pct} />
        <h3 className="mt-1 truncate font-display text-sm font-semibold">{offer.title}</h3>
        <p className="truncate text-xs text-mute">{merchant.name}</p>
        <p className="mt-1 text-sm font-bold tabular text-deal">{chf(offer.price)}</p>
        <p className="text-[11px] text-faint">{distLabel(distance)}</p>
      </div>
    </Link>
  );
}

export function FlashCard({ offer }: { offer: Offer }) {
  const { merchant, stock } = useOfferMeta(offer);
  if (!merchant) return null;
  return (
    <article className="flex w-[20rem] shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-ink text-paper">
      <Photo src={offer.image} alt={offer.title} className="h-full w-[6.5rem] shrink-0" />
      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <div className="flex items-center justify-between">
            <p className="inline-flex items-center gap-1 rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
              {OFFER_TYPE_LABELS[offer.type]}
            </p>
            {offer.until ? (
              <CountdownTimer untilTime={offer.until} merchantId={offer.merchantId} />
            ) : null}
          </div>
          <h3 className="mt-1.5 font-display text-base font-semibold leading-snug">{offer.title}</h3>
          <p className="text-xs text-white/60">{merchant.name}</p>
          <p className="mt-1 text-sm">
            {offer.originalPrice && offer.originalPrice > offer.price ? (
              <span className="text-white/45 line-through tabular">{chf(offer.originalPrice)}</span>
            ) : null}
            <span className="ml-2 font-bold tabular text-lime">{chf(offer.price)}</span>
          </p>
          <p className="mt-1.5">
            <StockBadge stock={stock} className={stock < 1 ? "" : "bg-lime text-ink"} />
          </p>
        </div>
        {stock < 1 ? (
          <Button size="sm" className="mt-2 h-9" disabled>
            Épuisée
          </Button>
        ) : (
          <Button asChild size="sm" className="mt-2 h-9">
            <Link to="/reserve/$offerId" params={{ offerId: offer.id }}>
              Réserver
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}

export function ListRow({ offer }: { offer: Offer }) {
  const { merchant, stock, distance, pct } = useOfferMeta(offer);
  if (!merchant) return null;
  return (
    <Link
      to="/offers/$offerId"
      params={{ offerId: offer.id }}
      className="flex gap-3 rounded-[var(--radius-lg)] bg-card p-2 shadow-[var(--shadow-card)] press"
    >
      <div className="relative">
        <Photo src={offer.image} alt={offer.title} className="size-24 rounded-[var(--radius-sm)]" />
        <DiscountBadge pct={pct} className="absolute left-1.5 top-1.5 h-5 px-1.5 text-[10px]" />
        <StockBadge stock={stock} className="absolute bottom-1.5 left-1.5 h-5 px-1.5 text-[10px]" />
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="text-xs text-mute">{merchant.name}</p>
        <h3 className="font-display text-[15px] font-semibold leading-snug">{offer.title}</h3>
        <Prices original={offer.originalPrice} price={offer.price} />
        <p className="mt-1 text-xs text-mute">
          {distLabel(distance)} · {offer.until}
        </p>
      </div>
      <HeartButton offerId={offer.id} className="size-9 shrink-0 self-start" />
    </Link>
  );
}

export function SectionHeader({
  title,
  action,
  icon,
}: {
  title: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-1">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  );
}

export function HorizontalRail({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1", className)}>
      {children}
    </div>
  );
}
