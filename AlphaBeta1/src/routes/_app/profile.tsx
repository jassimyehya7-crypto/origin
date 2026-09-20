import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  CircleHelp,
  Heart,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  Store,
  Ticket,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { chf } from "@/lib/format";
import { PRICING_NOTE } from "@/lib/labels";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/_app/profile")({
  component: Profile,
});

function Profile() {
  const reservations = useAppStore((s) => s.reservations);
  const followed = useAppStore((s) => s.followedMerchantIds);
  const mine = reservations.filter((r) => r.mine !== false);
  const counted = mine.filter((r) => r.status !== "cancelled" && r.status !== "refused");
  const saved = counted.reduce(
    (acc, r) => acc + Math.max(0, (r.originalPrice ?? r.unitPrice) - r.unitPrice) * r.qty,
    0,
  );

  return (
    <div className="px-5 pb-8 pt-6 safe-top">
      <Logo size="sm" />
      <div className="mt-5">
        <h1 className="font-display text-2xl font-bold tracking-tight">Camille D.</h1>
        <p className="text-sm text-mute">Membre OffresLocal · Villeneuve</p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Stat value={String(counted.length)} label="Réservations" />
        <Stat value={String(followed.length)} label="Commerces favoris" />
        <Stat value={chf(Math.max(0, saved))} label="Économisés" />
      </div>

      <ul className="mt-6 overflow-hidden rounded-[var(--radius-lg)] bg-card shadow-[var(--shadow-card)]">
        <Row to="/reservations" label="Mes réservations" icon={Ticket} />
        <Row to="/favorites" label="Mes favoris" icon={Heart} />
        <Row to="/preferences" label="Mes préférences" icon={SlidersHorizontal} />
        <li className="border-b border-line">
          <button
            type="button"
            onClick={async () => {
              const text =
                "Je t’invite sur OffresLocal — les meilleures offres des commerces autour de toi.";
              try {
                await navigator.clipboard.writeText(text);
                toast("Lien d’invitation copié");
              } catch {
                toast(text);
              }
            }}
            className="flex h-14 w-full items-center gap-3 px-4 text-left text-sm font-medium press"
          >
            <UserPlus className="size-4.5 text-mute" />
            <span className="flex-1">Inviter mes amis</span>
            <ChevronRight className="size-4 text-faint" />
          </button>
        </li>
        <Row to="/help" label="Aide & support" icon={CircleHelp} />
        <Row to="/settings" label="Paramètres" icon={Settings} />
      </ul>

      <p className="mt-8 text-[11px] font-semibold uppercase tracking-wide text-mute">
        Espaces démo
      </p>
      <ul className="mt-2 overflow-hidden rounded-[var(--radius-lg)] bg-card shadow-[var(--shadow-card)]">
        <Row to="/pro" label="Espace commerçant" icon={Store} hint="Épicerie Da Silva" />
        <Row to="/fondateur" label="Pilotage fondateur" icon={LayoutDashboard} hint="Villeneuve" />
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-mute">{PRICING_NOTE}</p>
    </div>
  );
}

function Row({
  to,
  label,
  icon: Icon,
  hint,
}: {
  to: string;
  label: string;
  icon: typeof Ticket;
  hint?: string;
}) {
  return (
    <li className="border-b border-line last:border-0">
      <Link to={to} className="flex h-14 items-center gap-3 px-4 text-sm font-medium press">
        <Icon className="size-4.5 text-mute" />
        <span className="flex-1">
          {label}
          {hint ? <span className="mt-0.5 block text-[11px] font-normal text-mute">{hint}</span> : null}
        </span>
        <ChevronRight className="size-4 text-faint" />
      </Link>
    </li>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-card px-2 py-3 text-center shadow-[var(--shadow-card)]">
      <p className="font-display text-lg font-bold tabular tracking-tight">{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-mute">{label}</p>
    </div>
  );
}
