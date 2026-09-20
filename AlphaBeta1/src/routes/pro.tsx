import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Logo } from "@/components/logo";
import { PRO_SHOP_NAME } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pro")({
  component: ProLayout,
});

function ProLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs = [
    { to: "/pro", label: "Aujourd’hui", exact: true },
    { to: "/pro/offers", label: "Offres", exact: false },
    { to: "/pro/new", label: "Créer", exact: false },
  ];

  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto min-h-dvh w-full max-w-lg bg-paper pb-10">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/95 px-5 pb-3 pt-4 backdrop-blur-md safe-top">
          <div className="flex items-center justify-between gap-3">
            <Logo to="/profile" size="sm" />
            <Link
              to="/profile"
              className="text-xs font-semibold text-mute hover:text-ink"
            >
              Quitter
            </Link>
          </div>
          <p className="mt-3 font-display text-xl font-bold tracking-tight">Espace commerçant</p>
          <p className="text-xs font-medium text-mute">{PRO_SHOP_NAME} · Villeneuve · démo</p>
          <div className="mt-3 flex items-center gap-2">
            {tabs.map((t) => {
              const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "h-9 rounded-full px-3.5 text-sm font-semibold press",
                    active ? "bg-lime text-ink" : "bg-card shadow-[var(--shadow-card)] text-mute",
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
            <Link
              to="/pro/new"
              className="ml-auto grid size-9 place-items-center rounded-full bg-lime text-ink press"
              aria-label="Nouvelle offre"
            >
              <Plus className="size-4" strokeWidth={2.6} />
            </Link>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
