import { cn, visualMark } from "@/lib/utils";

const sizes = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl",
  hero: "h-28 w-28 text-4xl",
} as const;

/** Letter/initial placeholder — no emoji icons. */
export function VisualMark({
  label,
  stored,
  size = "md",
  className,
}: {
  label: string;
  stored?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-ec-ink font-black uppercase tracking-tight text-ec-yellow",
        sizes[size],
        className
      )}
    >
      {visualMark(label, stored)}
    </span>
  );
}
