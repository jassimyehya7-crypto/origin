import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-ec-rule bg-ec-surface",
        padding && "p-4",
        className
      )}
    >
      {children}
    </div>
  );
}
