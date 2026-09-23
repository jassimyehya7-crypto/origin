import { cn } from "@/lib/utils";

export function DiscountBadge({
  pct,
  className,
}: {
  pct: number;
  className?: string;
}) {
  if (!pct) return null;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full bg-deal px-2 text-xs font-bold tabular text-white",
        className,
      )}
    >
      −{pct} %
    </span>
  );
}
