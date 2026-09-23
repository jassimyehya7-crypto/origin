import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function IconCircle({
  children,
  onClick,
  label,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-11 place-items-center rounded-full bg-card/90 text-ink shadow-[var(--shadow-card)] backdrop-blur-sm press",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function BackCircle({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <IconCircle label="Retour" onClick={() => router.history.back()} className={className}>
      <ArrowLeft className="size-4.5" />
    </IconCircle>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-paper md:max-w-lg">{children}</div>
  );
}
