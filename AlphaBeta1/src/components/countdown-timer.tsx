import { useState, useEffect } from "react";
import { Clock, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMerchant } from "@/lib/data/catalog";

interface CountdownTimerProps {
  untilTime: string; // Format "HH:MM" — heure d'expiration de l'offre
  merchantId?: string; // ID du commerce pour vérifier s'il est ouvert
  compact?: boolean;
  className?: string;
}

/** Seuil d'urgence : 2 heures (7200 secondes) */
const URGENCY_THRESHOLD_SECONDS = 7200;

export function CountdownTimer({ untilTime, merchantId, compact = false, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [reopenTime, setReopenTime] = useState<string>("");

  useEffect(() => {
    function calculateTimeLeft() {
      const now = new Date();
      const [hours, minutes] = untilTime.split(":").map(Number);

      const target = new Date();
      target.setHours(hours, minutes, 0, 0);

      // Si l'heure cible est passée AUJOURD'HUI → l'offre est expirée
      if (target <= now) {
        setIsExpired(true);
        setIsUrgent(false);
        setIsPaused(false);
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const diff = target.getTime() - now.getTime();
      const totalSeconds = Math.floor(diff / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      // Vérifier si le commerce est fermé (offre en pause)
      if (merchantId) {
        const merchant = getMerchant(merchantId);
        if (merchant) {
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const openMinutes = parseTime(merchant.openFrom);
          const closeMinutes = parseTime(merchant.openUntil);

          const isClosed = openMinutes <= closeMinutes
            ? currentMinutes < openMinutes || currentMinutes >= closeMinutes
            : currentMinutes < openMinutes && currentMinutes >= closeMinutes;

          if (isClosed) {
            setIsPaused(true);
            setIsUrgent(false);
            setReopenTime(merchant.openFrom);
            return { hours: h, minutes: m, seconds: s }; // On garde le temps restant en mémoire
          }
        }
      }

      setIsPaused(false);
      setIsUrgent(totalSeconds <= URGENCY_THRESHOLD_SECONDS);
      setIsExpired(false);
      return { hours: h, minutes: m, seconds: s };
    }

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [untilTime, merchantId]);

  // Mode pause nuit
  if (isPaused) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-2.5 py-1 font-bold text-indigo-300", className)}>
        <Moon className="size-3.5 shrink-0" />
        <span className="text-sm">Reprend à {reopenTime}</span>
      </span>
    );
  }

  // Mode expiré
  if (isExpired) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 font-bold text-red-400", className)}>
        <Clock className="size-3.5 shrink-0" />
        <span className="text-sm">Expirée</span>
      </span>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (compact) {
    return (
      <span className={cn("inline-flex items-center gap-1 tabular", className)}>
        <Clock className="size-3" />
        <span className={isUrgent ? "text-red-400 font-bold" : ""}>
          {timeLeft.hours > 0 ? `${timeLeft.hours}h${pad(timeLeft.minutes)}` : `${timeLeft.minutes}min`}
        </span>
      </span>
    );
  }

  // Format complet avec heures, minutes, secondes
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 tabular font-bold",
        isUrgent
          ? "bg-red-500/20 text-red-400 animate-pulse"
          : "bg-white/10 text-white",
        className
      )}
    >
      <Clock className="size-3.5 shrink-0" />
      <span className="text-sm">
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    </span>
  );
}

function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
