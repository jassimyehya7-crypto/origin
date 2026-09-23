import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chf } from "@/lib/format";
import { PRO_SHOP_ID } from "@/lib/labels";
import { useAppStore } from "@/lib/store";
import type { ReservationStatus } from "@/lib/types";

export const Route = createFileRoute("/pro/orders")({ component: ProOrders });

type Tab = "pending" | "confirmed" | "picked";
type Reservation = ReturnType<typeof useAppStore.getState>["reservations"][number];

function ProOrders() {
  const [tab, setTab] = useState<Tab>("pending");
  const reservations = useAppStore(useShallow((s) => s.reservations.filter((r) => r.merchantId === PRO_SHOP_ID)));
  const setStatus = useAppStore((s) => s.setReservationStatus);
  const completePickup = useAppStore((s) => s.completePickup);
  const counts = {
    pending: reservations.filter((r) => r.status === "pending").length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    picked: reservations.filter((r) => r.status === "picked").length,
  };
  const rows = reservations.filter((r) => r.status === tab);
  const move = async (id: string, status: ReservationStatus, message: string) => {
    toast(await setStatus(id, status) ? message : "La commande a déjà été modifiée");
  };
  const validatePickup = async (id: string, code: string) => {
    if (await completePickup(id, code)) {
      toast("Retrait validé");
      return;
    }
    toast("Code de retrait incorrect");
  };

  return (
    <main className="px-5 pb-10 pt-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-mute">Épicerie Da Silva</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Suivi des commandes</h1>
          <p className="mt-1 text-sm text-mute">{reservations.length} commande{reservations.length > 1 ? "s" : ""} aujourd’hui</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-1 rounded-[var(--radius-md)] bg-soft p-1">
        {([["pending", "À confirmer"], ["confirmed", "À retirer"], ["picked", "Récupérées"]] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-[var(--radius-sm)] px-1 py-3 text-[11px] font-bold ${tab === id ? "bg-lime text-ink" : "text-mute"}`}>
            {label} <span className="ml-1">{counts[id]}</span>
          </button>
        ))}
      </div>
      <section className="mt-5 space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] bg-card px-5 py-10 text-center shadow-[var(--shadow-card)]">
            <Check className="mx-auto size-7 text-ok" />
            <p className="mt-3 font-display font-semibold">Tout est à jour</p>
            <p className="mt-1 text-sm text-mute">Aucune commande dans cette étape.</p>
          </div>
        ) : rows.map((reservation) => (
          <OrderCard
            key={reservation.id}
            reservation={reservation}
            onConfirm={() => move(reservation.id, "confirmed", "Réservation confirmée")}
            onRefuse={() => move(reservation.id, "refused", "Demande refusée")}
            onPickup={(code) => validatePickup(reservation.id, code)}
          />
        ))}
      </section>
    </main>
  );
}

function OrderCard({ reservation, onConfirm, onRefuse, onPickup }: { reservation: Reservation; onConfirm: () => void; onRefuse: () => void; onPickup: (code: string) => void }) {
  const [code, setCode] = useState("");
  const label = reservation.status === "pending" ? "Nouvelle demande" : reservation.status === "confirmed" ? "Client attendu" : "Commande récupérée";
  return (
    <article className="rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex gap-3">
        <Photo src={reservation.image} alt="" className="size-16 shrink-0 rounded-[var(--radius-md)]" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-mute">{reservation.code} · {reservation.clientName ?? "Client"}</p>
          <h2 className="mt-1 font-display text-[16px] font-semibold">{reservation.title}</h2>
          <p className="text-sm text-mute">{reservation.qty} × {chf(reservation.unitPrice)}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${reservation.status === "pending" ? "text-deal" : reservation.status === "picked" ? "text-ok" : "text-mute"}`}><Clock3 className="size-3.5" />{label}</span>
        <span className="text-xs font-semibold text-mute">Retrait {reservation.until}</span>
      </div>
      {reservation.status === "pending" ? (
        <div className="mt-4 grid grid-cols-2 gap-2"><Button onClick={onConfirm}>Confirmer</Button><Button variant="soft" onClick={onRefuse}>Refuser</Button></div>
      ) : reservation.status === "confirmed" ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-[var(--radius-md)] bg-lime/25 px-4 py-3 text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-mute">Code de retrait</p>
            <p className="mt-1 font-mono text-2xl font-black tracking-widest">{reservation.code}</p>
            <p className="mt-1 text-[11px] text-mute">Même code que dans le SMS fictif du client</p>
          </div>
          <div>
            <label htmlFor={`pickup-${reservation.id}`} className="text-xs font-bold text-mute">Code présenté au comptoir</label>
            <Input id={`pickup-${reservation.id}`} className="mt-1.5" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="EC-4821" autoCapitalize="characters" />
            <Button className="mt-2 w-full" disabled={!code.trim()} onClick={() => onPickup(code)}>Récupérer la commande</Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-ok/10 py-3 text-xs font-bold text-ok"><Check className="size-4" />Retrait validé</p>
      )}
    </article>
  );
}
