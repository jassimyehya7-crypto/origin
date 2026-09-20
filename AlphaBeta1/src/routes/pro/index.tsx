import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, ShoppingBag, Tag, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { liveOffersForMerchant } from "@/lib/data/catalog";
import { chf } from "@/lib/format";
import { PRO_SHOP_ID, RESERVATION_STATUS_LABELS } from "@/lib/labels";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pro/")({
  component: ProHome,
});

function ProHome() {
  const extraOffers = useAppStore((s) => s.extraOffers);
  const hiddenOfferIds = useAppStore((s) => s.hiddenOfferIds);
  const reservations = useAppStore((s) => s.reservations);
  const setStatus = useAppStore((s) => s.setReservationStatus);
  const stockByOffer = useAppStore((s) => s.stockByOffer);

  const shopResas = reservations.filter((r) => r.merchantId === PRO_SHOP_ID);
  const pending = shopResas.filter((r) => r.status === "pending");
  const confirmed = shopResas.filter((r) => r.status === "confirmed");
  const live = liveOffersForMerchant(PRO_SHOP_ID, extraOffers, hiddenOfferIds).filter((o) => {
    const stock = stockByOffer[o.id] ?? o.stock;
    return stock > 0;
  });
  const pickups = shopResas.filter((r) => r.status === "picked" || r.status === "confirmed").length;

  return (
    <div className="px-5 py-5">
      <div className="mb-5">
        <h1 className="font-display text-[1.75rem] leading-tight">Bonjour</h1>
        <p className="mt-1 text-sm font-semibold text-mute">Ouvert jusqu’à 19h00</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3">
        <Kpi icon={Clock} value={pending.length} label="À traiter" />
        <Kpi icon={ShoppingBag} value={confirmed.length} label="Confirmées" />
        <Kpi icon={Tag} value={live.length} label="Offres live" />
        <Kpi icon={TrendingUp} value={pickups} label="Retraits" />
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold">À confirmer</h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded-[var(--radius-md)] bg-card px-4 py-5 text-sm text-mute shadow-[var(--shadow-card)]">
            Aucune demande en attente. Réservez le panier Da Silva côté client pour le voir arriver ici.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {pending.map((r) => (
              <article key={r.id} className="rounded-[var(--radius-lg)] bg-card p-3 shadow-[var(--shadow-card)]">
                <div className="flex gap-3">
                  <Photo src={r.image} alt="" className="size-14 rounded-[var(--radius-sm)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-mute">{r.code}</p>
                    <h3 className="font-display text-[15px] font-semibold">{r.title}</h3>
                    <p className="text-xs text-mute">
                      {r.clientName ?? "Client"} · {r.qty} × {chf(r.unitPrice)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setStatus(r.id, "confirmed");
                      toast("Réservation confirmée");
                    }}
                  >
                    Confirmer
                  </Button>
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() => {
                      setStatus(r.id, "refused");
                      toast("Demande refusée");
                    }}
                  >
                    Refuser
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">À préparer</h2>
        {confirmed.length === 0 ? (
          <p className="mt-3 rounded-[var(--radius-md)] bg-card px-4 py-5 text-sm text-mute shadow-[var(--shadow-card)]">
            Aucune réservation à préparer.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {confirmed.map((r) => (
              <article key={r.id} className="rounded-[var(--radius-lg)] bg-card p-3 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-3">
                  <Photo src={r.image} alt="" className="size-14 rounded-[var(--radius-sm)]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-black">{r.code}</p>
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-xs text-mute">{RESERVATION_STATUS_LABELS[r.status]}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ink"
                    onClick={() => {
                      setStatus(r.id, "picked");
                      toast("Marqué récupéré");
                    }}
                  >
                    Récupéré
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Link
        to="/pro/new"
        className={cn(
          "mt-8 flex h-14 items-center justify-center rounded-[var(--radius-lg)] bg-lime text-sm font-bold text-ink press",
        )}
      >
        Nouvelle offre
      </Link>
    </div>
  );
}

function Kpi({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex size-8 items-center justify-center rounded-[10px] bg-lime/40">
        <Icon className="size-4" strokeWidth={2.5} />
      </div>
      <p className="font-display text-2xl font-bold tabular">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-wide text-mute">{label}</p>
    </div>
  );
}
