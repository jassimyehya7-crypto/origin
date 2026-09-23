import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skel rounded-[var(--radius-md)]", className)} />;
}
