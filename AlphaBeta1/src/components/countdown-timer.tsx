import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  untilTime: string; // Format "HH:MM"
  compact?: boolean;
  className?: string;
}

/** Seuil d'urgence : 2 heures (7200 secondes) */
const URGENCY_THRESHOLD_SECONDS = 7200;

export function CountdownTimer({ untilTime, compact = false, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

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
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const diff = target.getTime() - now.getTime();
      const totalSeconds = Math.floor(diff / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      setIsUrgent(totalSeconds <= URGENCY_THRESHOLD_SECONDS);
      setIsExpired(false);
      return { hours: h, minutes: m, seconds: s };
    }

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [untilTime]);

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
