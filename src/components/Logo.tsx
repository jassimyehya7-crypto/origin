import { cn } from "@/lib/utils";

export function Logo({
  size = "md",
  withText = true,
  inverted = false,
  className,
}: {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  inverted?: boolean;
  className?: string;
}) {
  const mark =
    size === "sm" ? "h-8 w-8 text-[22px]" : size === "lg" ? "h-12 w-12 text-[34px]" : "h-10 w-10 text-[28px]";
  const text =
    size === "sm" ? "text-[17px]" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <div
      className={cn("flex items-center gap-2.5", className)}
      aria-label="Épicerie Club"
    >
      {/* Jaune Club mark — rare yellow, brand signature only */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-[11px] border-2 border-ec-ink bg-ec-yellow font-bold leading-none text-ec-ink",
          mark,
          inverted && "border-white"
        )}
        style={{ fontFamily: "Georgia, serif" }}
        aria-hidden
      >
        é
      </div>
      {withText && (
        <span
          className={cn(
            "tracking-tight",
            text,
            inverted ? "text-white" : "text-ec-ink"
          )}
        >
          <span className="font-black">picerie</span>{" "}
          <span className="font-normal">Club</span>
        </span>
      )}
    </div>
  );
}
