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
    size === "sm" ? "h-7 w-7 text-[20px]" : size === "lg" ? "h-11 w-11 text-[32px]" : "h-9 w-9 text-[26px]";
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
          "flex shrink-0 items-center justify-center rounded-[2px] bg-ec-yellow font-bold leading-none text-ec-ink",
          mark,
          inverted && "ring-1 ring-white"
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
