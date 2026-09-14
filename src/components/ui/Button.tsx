import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "confirm";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  // Market ink — primary actions
  primary:
    "bg-ec-ink text-white hover:bg-ec-ink/90 disabled:bg-ec-rule disabled:text-ec-muted",
  // Confirm moments — rare yellow
  confirm:
    "bg-ec-yellow text-ec-ink hover:brightness-95 disabled:bg-ec-rule disabled:text-ec-muted",
  secondary: "bg-ec-soft text-ec-ink hover:bg-ec-rule/60",
  ghost: "bg-transparent text-ec-ink hover:bg-ec-soft",
  danger: "bg-ec-red text-white hover:brightness-95",
  outline:
    "bg-white border border-ec-rule text-ec-ink hover:border-ec-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-[12px]",
  md: "h-11 px-4 text-sm rounded-[12px]",
  lg: "h-12 px-5 text-base rounded-[12px]",
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  full,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        full && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
