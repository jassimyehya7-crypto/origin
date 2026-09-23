import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-8 place-items-center rounded-[3px] bg-lime text-[22px] font-bold leading-none text-ink",
        className,
      )}
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      aria-hidden
    >
      O
    </span>
  );
}

export function Logo({
  to = "/",
  size = "md",
}: {
  to?: string;
  size?: "sm" | "md" | "lg";
}) {
  const text = size === "sm" ? "text-[17px]" : size === "lg" ? "text-2xl" : "text-xl";
  const mark = size === "sm" ? "size-7 text-[20px]" : size === "lg" ? "size-11 text-[32px]" : "size-9 text-[26px]";
  return (
    <Link to={to} className="notranslate flex items-center gap-1 press" aria-label="OffresLocal">
      <LogoMark className={mark} />
      <span className={cn("tracking-tight text-ink", text)}>
        <span className="font-black">ffres</span>
        <span className="font-medium">Local</span>
      </span>
    </Link>
  );
}
