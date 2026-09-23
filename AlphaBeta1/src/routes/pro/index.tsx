import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight, Clock3, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { liveOffersForMerchant } from "@/lib/data/catalog";
import { chf } from "@/lib/format";
import { PRO_SHOP_ID } from "@/lib/labels";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/pro/")({ component: ProHome });

function ProHome() {
  const extraOffers = useAppStore((s) => s.extraOffers);
  const hiddenOfferIds = useAppStore((s) => s.hiddenOfferIds);
  const reservations = useAppStore((s) => s.reservations);
  const setStatus = useAppStore((s) => s.setReservationStatus);
  const stockByOffer = useAppStore((s) => s.stockByOffer);
  const shopResas = reservations.filter((r) => r.merchantId === PRO_SHOP_ID);
  const pending = shopResas.filter((r) => r.status === "pending");
  const confirmed = shopResas.filter((r) => r.status === "confirmed");
  const ready = shopResas.filter((r) => r.status === "picked").length;
  const liveCount = liveOffersForMerchant(PRO_SHOP_ID, extraOffers, hiddenOfferIds).filter((o) => (stockByOffer[o.id] ?? o.stock) > 0).length;
  const first = pending[0];

  return (
    <main className="px-5 pb-10 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-mute">Bonjour,</p>
          <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
            <h1 className="notranslate font-display text-[1.8rem] font-bold leading-tight tracking-tight">Épicerie Da Silva</h1>
            <p className="whitespace-nowrap pb-1 text-right text-[11px] font-medium leading-tight text-mute">Espace commerçant · Villeneuve</p>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-ok/15 px-3 py-2 text-xs font-bold"><span className="size-2 rounded-full bg-ok" />Ouvert jusqu’à 19h00</div>
        </div>
      </div>

      {first ? <PriorityRequest reservation={first} onConfirm={async () => { toast(await setStatus(first.id, "confirmed") ? "Demande confirmée" : "La demande a déjà été modifiée"); }} onRefuse={async () => { toast(await setStatus(first.id, "refused") ? "Demande refusée" : "La demande a déjà été modifiée"); }} /> : <EmptyToday />}

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold">Vos commandes aujourd’hui</h2><Link to="/pro/orders" className="inline-flex items-center text-xs font-semibold text-mute">Voir tout <ChevronRight className="size-4" /></Link></div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Progress label="À traiter" value={pending.length} active />
          <Progress label="À retirer" value={confirmed.length} />
          <Progress label="Récupérées" value={ready} />
        </div>
      </section>

      <Link to="/pro/new" className="mt-7 flex items-center gap-3 rounded-[var(--radius-lg)] bg-lime/25 p-4 press">
        <span className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-lime"><Plus className="size-6" /></span>
        <span className="flex-1"><b className="block font-display text-base">Créer une offre</b><small className="mt-0.5 block text-xs text-mute">Publiez en quelques secondes</small></span><ChevronRight className="size-5" />
      </Link>

      <div className="mt-6 grid grid-cols-2 gap-2"><Info value={liveCount} label="Offres live" /><Info value={confirmed.length + ready} label="Retraits du jour" /></div>
    </main>
  );
}

function PriorityRequest({ reservation, onConfirm, onRefuse }: { reservation: { id: string; code: string; title: string; image: string; qty: number; unitPrice: number; until: string; clientName?: string }; onConfirm: () => void; onRefuse: () => void }) {
  return <section className="mt-6 rounded-[var(--radius-xl)] bg-card p-4 shadow-[var(--shadow-card)]"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-deal/10 text-deal"><Clock3 className="size-5" /></span><div><p className="font-display text-lg font-bold text-deal">1 demande à confirmer</p><p className="text-xs text-mute">À retirer aujourd’hui</p></div></div><div className="mt-5 flex gap-3"><Photo src={reservation.image} alt="" className="size-16 shrink-0 rounded-[var(--radius-md)]" /><div className="min-w-0"><p className="text-xs text-mute">{reservation.code} · {reservation.clientName ?? "Client"}</p><h3 className="mt-1 font-display text-[15px] font-semibold">{reservation.title}</h3><p className="text-sm text-mute">{reservation.qty} × {chf(reservation.unitPrice)}</p></div></div><div className="mt-4 inline-flex items-center gap-2 rounded-full bg-soft px-3 py-2 text-xs font-bold"><Clock3 className="size-3.5" />Aujourd’hui à {reservation.until}</div><div className="mt-4 grid grid-cols-[1.15fr_.85fr] gap-2"><Button onClick={onConfirm}><Check className="size-4" />Confirmer</Button><Button variant="soft" onClick={onRefuse}><X className="size-4" />Refuser</Button></div></section>;
}

function Progress({ label, value, active = false }: { label: string; value: number; active?: boolean }) { return <div className="flex flex-col items-center gap-2 text-center"><span className={`size-4 rounded-full border-4 border-paper ${active ? "bg-lime" : "bg-mute/45"} shadow-[0_0_0_1px_var(--color-line)]`} /><span className="text-[11px] font-semibold text-mute">{label}</span><strong className="font-display text-xl">{value}</strong></div>; }
function Info({ value, label }: { value: number; label: string }) { return <div className="rounded-[var(--radius-md)] bg-card px-3 py-3 text-center shadow-[var(--shadow-card)]"><p className="font-display text-xl font-bold">{value}</p><p className="text-[10px] font-bold uppercase tracking-wide text-mute">{label}</p></div>; }
function EmptyToday() { return <section className="mt-6 rounded-[var(--radius-xl)] bg-card px-5 py-8 text-center shadow-[var(--shadow-card)]"><span className="mx-auto grid size-12 place-items-center rounded-full bg-ok/15 text-ok"><Check className="size-6" /></span><h2 className="mt-3 font-display text-lg font-bold">Tout est sous contrôle</h2><p className="mt-1 text-sm text-mute">Aucune demande urgente pour le moment.</p></section>; }
