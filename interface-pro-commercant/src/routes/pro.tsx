import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Bell, Home, ListChecks, LogOut, Plus, Tag } from "lucide-react";
import { Logo } from "@/components/logo";
import { ProLanguageSelector } from "@/components/pro-language-selector";
import { ProAccessGate } from "@/components/pro-access-gate";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/pro")({ component: () => <ProAccessGate><ProLayout /></ProAccessGate> });

function ProLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reservations = useAppStore((s) => s.reservations);
  const pending = reservations.filter((r) => r.merchantId === "shop_dasilva" && r.status === "pending").length;
  const tabs = [
    { to: "/pro", label: "Aujourd’hui", icon: Home, exact: true },
    { to: "/pro/orders", label: "Commandes", icon: ListChecks, exact: false },
    { to: "/pro/offers", label: "Offres", icon: Tag, exact: false },
  ];

  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto min-h-dvh w-full max-w-lg bg-paper pb-24">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/95 px-5 pb-3 pt-4 backdrop-blur-md safe-top">
          <div className="flex items-center gap-3">
            <Logo to="/pro" size="sm" />
            <div className="flex-1" />
            <ProLanguageSelector />
            <Link to="/pro/notifications" className="relative grid size-10 place-items-center rounded-full hover:bg-soft" aria-label="Notifications">
              <Bell className="size-5" />
              {pending > 0 ? <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-deal text-[9px] font-bold text-white">{pending}</span> : null}
            </Link>
            {supabase ? (
              <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-soft" aria-label="Se déconnecter" title="Se déconnecter" onClick={() => void supabase?.auth.signOut()}>
                <LogOut className="size-5" />
              </button>
            ) : null}
          </div>
        </header>

        <Outlet />

        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-lg border-t border-line bg-card/95 px-3 pt-2 backdrop-blur-md" style={{ paddingBottom: "calc(0.45rem + env(safe-area-inset-bottom))" }} aria-label="Navigation commerçant">
          {tabs.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={cn("relative flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold", active ? "text-ink" : "text-mute")}>
                {active ? <span className="absolute top-0 h-1 w-12 rounded-b-full bg-lime" /> : null}
                <Icon className="size-5" strokeWidth={active ? 2.5 : 1.8} />
                <span>{label}</span>
                {label === "Commandes" && pending > 0 ? <span className="absolute right-1/4 top-1 grid size-4 place-items-center rounded-full bg-deal text-[9px] font-bold text-white">{pending}</span> : null}
              </Link>
            );
          })}
          <Link to="/pro/new" className="flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold text-ink" aria-label="Créer une offre">
            <span className="grid size-8 place-items-center rounded-full bg-lime"><Plus className="size-4" strokeWidth={2.6} /></span>
            <span>Créer</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
