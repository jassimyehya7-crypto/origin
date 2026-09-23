import { Drawer } from "vaul";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-[var(--radius-xl)] bg-card outline-none",
            className,
          )}
        >
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line" />
          {title ? (
            <Drawer.Title className="px-5 pt-4 font-display text-lg font-semibold tracking-tight">
              {title}
            </Drawer.Title>
          ) : (
            <Drawer.Title className="sr-only">Panneau</Drawer.Title>
          )}
          <div className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
