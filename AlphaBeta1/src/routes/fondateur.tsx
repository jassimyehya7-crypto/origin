import { createFileRoute, Link } from "@tanstack/react-router";
import { Store, Tag, Ticket, Users } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { MERCHANTS, mergeOffers } from "@/lib/data/catalog";
import { CATEGORY_LABELS } from "@/lib/labels";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/fondateur")({
  component: Fondateur,
});

function Fondateur() {
  const extraOffers = useAppStore((s) => s.extraOffers);
  const hiddenOfferIds = useAppStore((s) => s.hiddenOfferIds);
  const reservations = useAppStore((s) => s.reservations);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const offers = mergeOffers(extraOffers, hiddenOfferIds);
  const live = offers.filter((o) => (useAppStore.getState().stockByOffer[o.id] ?? o.stock) > 0);
  const pending = reservations.filter((r) => r.status === "pending").length;
  const mine = reservations.filter((r) => r.mine !== false).length;

  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto min-h-dvh w-full max-w-lg bg-paper pb-10">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/95 px-5 pb-3 pt-4 backdrop-blur-md safe-top">
          <div className="flex items-center justify-between gap-3">
            <Logo to="/profile" size="sm" />
            <Link to="/profile" className="text-xs font-semibold text-mute hover:text-ink">
              Quitter
            </Link>
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">Pilotage</h1>
          <p className="text-sm font-medium text-mute">OffresLocal · Villeneuve · démo locale</p>
        </header>

        <div className="px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <Kpi icon={Users} value={mine} label="Clients démo" />
            <Kpi icon={Store} value={MERCHANTS.length} label="Commerces" />
            <Kpi icon={Tag} value={live.length} label="Offres live" />
            <Kpi icon={Ticket} value={pending} label="Demandes" />
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Commerces A1</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                resetDemo();
                toast("Démo réinitialisée");
              }}
            >
              Réinitialiser
            </Button>
          </div>

          <ul className="mt-3 space-y-2">
            {MERCHANTS.map((m) => {
              const count = offers.filter((o) => o.merchantId === m.id).length;
              const cat = m.category === "all" ? "autre" : m.category;
              return (
                <li key={m.id}>
                  <Link
                    to="/merchants/$merchantId"
                    params={{ merchantId: m.id }}
                    className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-card p-2.5 shadow-[var(--shadow-card)] press"
                  >
                    <Photo src={m.cover} alt="" className="size-12 rounded-[var(--radius-sm)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold">{m.name}</p>
                      <p className="text-[11px] text-mute">
                        {CATEGORY_LABELS[cat]} · {count} offre{count > 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-mute">{m.openUntil}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Store;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center gap-2 text-mute">
        <Icon className="size-4" />
        <span className="text-[10px] font-extrabold uppercase">{label}</span>
      </div>
      <p className="font-display text-2xl font-bold tabular">{value}</p>
    </div>
  );
}
