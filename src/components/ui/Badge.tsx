import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  flash: "bg-ec-red text-white",
  promo: "bg-ec-blue text-white",
  arrivage: "bg-ec-green text-ec-ink",
  exclusive: "bg-[#7C3AED] text-white",
  derniere: "bg-ec-ink text-white",
  success: "bg-ec-green/15 text-ec-green",
  warning: "bg-ec-yellow/40 text-ec-ink",
  danger: "bg-ec-red/10 text-ec-red",
  muted: "bg-ec-soft text-ec-muted",
  info: "bg-[#eef3ff] text-ec-blue",
};

export function Badge({
  children,
  variant = "muted",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide",
        variants[variant],
        className
      )}
    >
      {variant === "success" && (
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-ec-green"
        />
      )}
      {children}
    </span>
  );
}
