import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

export function StockBadge({
  stock,
  className,
}: {
  stock: number;
  className?: string;
}) {
  if (stock < 1) {
    return (
      <span
        className={cn(
          "inline-flex h-7 items-center rounded-full bg-ink px-2.5 text-xs font-bold text-paper",
          className,
        )}
      >
        Épuisé
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full bg-lime px-2.5 text-xs font-bold tabular text-ink",
        className,
      )}
    >
      <Package className="size-3.5" strokeWidth={2.4} />
      Plus que {stock}
    </span>
  );
}
