import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Photo } from "@/components/photo";
import { chf } from "@/lib/format";
import { RESERVATION_STATUS_LABELS } from "@/lib/labels";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/reservations")({
  component: Reservations,
});

type Tab = "upcoming" | "done" | "cancelled";

const TABS: { id: Tab; label: string }[] = [
  { id: "upcoming", label: "À venir" },
  { id: "done", label: "Terminées" },
  { id: "cancelled", label: "Annulées" },
];

function Reservations() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const navigate = useNavigate();
  const reservations = useAppStore((s) => s.reservations);
  const mine = reservations.filter((r) => r.mine !== false);

  const list = mine.filter((r) => {
    if (tab === "cancelled") return r.status === "cancelled" || r.status === "refused";
    if (tab === "done") return r.status === "picked";
    return r.status === "pending" || r.status === "confirmed";
  });

  return (
    <div>
      <header className="px-5 pb-3 pt-6 safe-top">
        <h1 className="font-display text-2xl font-bold tracking-tight">Mes réservations</h1>
        <div className="mt-4 flex rounded-full bg-soft p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "h-10 flex-1 rounded-full text-xs font-semibold press",
                tab === t.id ? "bg-lime text-ink" : "text-mute",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>
      {list.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={tab === "upcoming" ? "Pas de réservation à venir" : "Rien ici pour l’instant"}
          body="Réservez une offre près de vous — aucun paiement en ligne."
          action={{ label: "Explorer les offres", onClick: () => navigate({ to: "/" }) }}
        />
      ) : (
        <div className="space-y-3 px-5 pb-4">
          {list.map((r) => (
            <Link
              key={r.id}
              to="/reservations/$reservationId"
              params={{ reservationId: r.id }}
              className="flex gap-3 rounded-[var(--radius-lg)] bg-card p-2.5 shadow-[var(--shadow-card)] press"
            >
              <Photo src={r.image} alt={r.title} className="size-20 rounded-[var(--radius-sm)]" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-mute">
                  {RESERVATION_STATUS_LABELS[r.status]}{r.status === "pending" ? "" : ` · ${r.code}`}
                </p>
                <h2 className="font-display text-[15px] font-semibold">{r.title}</h2>
                <p className="text-xs text-mute">{r.merchantName}</p>
                <p className="mt-1 text-sm font-bold tabular">{chf(r.unitPrice * r.qty)}</p>
                <p className="text-xs text-mute">À retirer avant {r.until}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
