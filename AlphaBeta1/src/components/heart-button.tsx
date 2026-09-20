import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

export function HeartButton({
  offerId,
  className,
}: {
  offerId: string;
  className?: string;
}) {
  const on = useAppStore((s) => s.favoriteOfferIds.includes(offerId));
  const toggle = useAppStore((s) => s.toggleFavoriteOffer);

  return (
    <button
      type="button"
      aria-label={on ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(offerId);
        toast(on ? "Retiré des favoris" : "Enregistré dans vos favoris");
      }}
      className={cn(
        "grid size-11 place-items-center rounded-full bg-card/90 text-ink shadow-[var(--shadow-card)] backdrop-blur-sm press",
        className,
      )}
    >
      <Heart
        className={cn("size-4.5", on && "fill-deal text-deal")}
        strokeWidth={1.8}
      />
    </button>
  );
}
