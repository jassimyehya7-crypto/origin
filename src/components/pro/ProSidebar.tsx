"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  LayoutDashboard,
  Moon,
  PlusCircle,
  Settings,
  Store,
  Tag,
} from "lucide-react";
import { Logo } from "../Logo";
import { cn } from "@/lib/utils";
import { PRICING_NOTE } from "@/lib/labels";

const items = [
  { href: "/pro", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/pro/reservations", label: "Réservations", icon: ClipboardList },
  { href: "/pro/cloture", label: "Clôture", icon: Moon },
  { href: "/pro/offres", label: "Mes offres", icon: Tag },
  { href: "/pro/offres/nouvelle", label: "Créer une offre", icon: PlusCircle },
  { href: "/pro/parametres", label: "Paramètres", icon: Settings },
];

export function ProSidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-64 flex-col bg-ec-dark text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Logo inverted />
        <p className="mt-1 text-xs text-white/60">Pro · Villeneuve VD</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/pro" ? pathname === "/pro" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-white/70">
          <Store className="h-3.5 w-3.5" />
          Épicerie Da Silva (démo)
        </div>
        <p className="text-[10px] leading-relaxed text-white/45">{PRICING_NOTE}</p>
        <Link
          href="/"
          className="mt-3 block text-xs font-medium text-ec-leaf hover:underline"
        >
          ← Voir le feed client
        </Link>
      </div>
    </aside>
  );
}

export function ProMobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-ec-line bg-white lg:hidden">
      {items.slice(0, 4).map(({ href, label, icon: Icon }) => {
        const active =
          href === "/pro" ? pathname === "/pro" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
              active ? "text-ec-green" : "text-ec-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            {label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
