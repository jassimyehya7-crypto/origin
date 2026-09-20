import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Heart, House, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Accueil", icon: House },
  { to: "/explore", label: "Explorer", icon: Compass },
  { to: "/favorites", label: "Favoris", icon: Heart },
  { to: "/profile", label: "Profil", icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-lg items-stretch md:max-w-3xl">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium tracking-wide",
                active ? "text-ink" : "text-faint",
              )}
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full transition-colors duration-[var(--motion-quick)]",
                  active && "bg-lime",
                )}
              >
                <Icon className="size-4.5" strokeWidth={active ? 2.4 : 1.8} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
