import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold tracking-tight press select-none disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
  {
    variants: {
      variant: {
        lime: "bg-lime text-ink hover:bg-lime-deep",
        ink: "bg-ink text-paper hover:bg-ink/90",
        ghost: "bg-transparent text-ink hover:bg-soft",
        outline: "bg-card text-ink shadow-[var(--shadow-card)] hover:bg-soft",
        deal: "bg-deal text-white hover:bg-deal/90",
        soft: "bg-soft text-ink hover:bg-line",
      },
      size: {
        sm: "h-10 px-3.5 text-sm rounded-[var(--radius-sm)]",
        md: "h-12 px-5 text-sm rounded-[var(--radius-md)]",
        lg: "h-14 w-full px-6 text-sm rounded-[var(--radius-lg)]",
        icon: "size-11 rounded-full",
        pill: "h-10 px-4 text-sm rounded-full",
      },
    },
    defaultVariants: { variant: "lime", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: Props) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
