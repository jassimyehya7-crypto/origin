"use client";

import { useEffect, useState } from "react";

/** Recomputes a timed offer's remaining validity while the page is open. */
export function OfferTimeRemaining({ validUntil, compact = false }: { validUntil: string; compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  if (now === null) {
    return <>Jusqu&apos;à {new Intl.DateTimeFormat("fr-CH", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zurich" }).format(new Date(validUntil))}</>;
  }
  const minutes = Math.max(0, Math.ceil((new Date(validUntil).getTime() - now) / 60_000));
  if (minutes === 0) return <>Offre terminée</>;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const duration = hours ? `${hours} h${rest ? ` ${String(rest).padStart(2, "0")}` : ""}` : `${rest} min`;
  return <>{compact ? `Encore ${duration}` : `Expire dans ${duration}`}</>;
}
