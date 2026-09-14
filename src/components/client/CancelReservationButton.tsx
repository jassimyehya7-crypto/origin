"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { ReservationStatus } from "@/lib/types";
import { EC_PHONE_KEY, EC_SOFT_ID_KEY, ensureSoftUserId } from "@/lib/soft-profile";

const CANCELLABLE: ReservationStatus[] = ["EN_ATTENTE", "CONFIRMEE"];

export function CancelReservationButton({
  reservationId,
  status,
  compact,
}: {
  reservationId: string;
  status: ReservationStatus;
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!CANCELLABLE.includes(status)) return null;

  async function cancel() {
    if (
      !confirm(
        "Annuler cette réservation ? Le stock sera remis à disposition."
      )
    ) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const softUserId =
        (typeof window !== "undefined" &&
          (localStorage.getItem(EC_SOFT_ID_KEY) || ensureSoftUserId())) ||
        "";
      const clientPhone =
        (typeof window !== "undefined" &&
          (localStorage.getItem(EC_PHONE_KEY) || "").trim()) ||
        "";
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ANNULEE", softUserId, clientPhone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Impossible d’annuler");
        return;
      }
      router.refresh();
      router.push("/reservations");
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "" : "mt-3"}>
      <Button
        type="button"
        variant={compact ? "outline" : "danger"}
        size={compact ? "sm" : "md"}
        full={!compact}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void cancel();
        }}
        disabled={loading}
      >
        {loading ? "Annulation…" : "Annuler"}
      </Button>
      {error ? (
        <p className="mt-1 text-xs font-bold text-ec-red">{error}</p>
      ) : null}
    </div>
  );
}
