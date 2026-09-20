import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { GoogleRating } from "@/components/google-rating";
import { Photo } from "@/components/photo";
import { liveOffersForMerchant } from "@/lib/data/catalog";
import { distLabel } from "@/lib/format";
import { extraMeters } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";
import type { Merchant } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MerchantCard({ merchant }: { merchant: Merchant }) {
  const locationId = useAppStore((s) => s.locationId);
  const followed = useAppStore((s) => s.followedMerchantIds.includes(merchant.id));
  const toggle = useAppStore((s) => s.toggleFollowMerchant);
  const extraOffers = useAppStore((s) => s.extraOffers);
  const hiddenOfferIds = useAppStore((s) => s.hiddenOfferIds);
  const distance = merchant.distanceM + extraMeters(locationId);
  const count = liveOffersForMerchant(merchant.id, extraOffers, hiddenOfferIds).length;

  return (
    <div className="flex gap-3 rounded-[var(--radius-lg)] bg-card p-2.5 shadow-[var(--shadow-card)]">
      <Link to="/merchants/$merchantId" params={{ merchantId: merchant.id }} className="flex min-w-0 flex-1 gap-3">
        <Photo
          src={merchant.banner}
          alt={merchant.name}
          className="size-20 rounded-[var(--radius-sm)]"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-semibold leading-snug">{merchant.name}</h3>
          <p className="text-xs text-mute">
            {merchant.city} · {distLabel(distance)}
          </p>
          <p className="mt-1">
            <GoogleRating
              rating={merchant.rating}
              count={merchant.reviewCount}
              className="text-xs"
              compact
            />
          </p>
          <p className="mt-1 text-xs text-mute">
            {count} offre{count > 1 ? "s" : ""} disponible{count > 1 ? "s" : ""}
          </p>
        </div>
      </Link>
      <button
        type="button"
        aria-label={followed ? "Ne plus suivre" : "Suivre"}
        onClick={() => {
          toggle(merchant.id);
          toast(followed ? "Commerce retiré des favoris" : "Commerce suivi");
        }}
        className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-soft press"
      >
        <Heart className={cn("size-5", followed ? "fill-deal text-deal" : "text-mute")} />
      </button>
    </div>
  );
}
