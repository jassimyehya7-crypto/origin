import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-[var(--motion-quick)]",
        checked ? "bg-lime" : "bg-line",
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "block size-6 translate-x-0.5 rounded-full bg-card shadow-[var(--shadow-card)] transition-transform duration-[var(--motion-quick)] ease-[var(--ease-out)]",
          checked && "translate-x-[22px] bg-ink",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
