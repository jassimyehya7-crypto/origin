"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Store, Sun, Tag } from "lucide-react";
import { Logo } from "../Logo";
import { cn } from "@/lib/utils";
import { PRICING_NOTE } from "@/lib/labels";
import { PRO_SHOP_CITY, PRO_SHOP_NAME } from "@/lib/pro-shop";

const items = [
  { href: "/pro", label: "Aujourd'hui", icon: Sun },
  { href: "/pro/offres", label: "Offres", icon: Tag },
  { href: "/pro/parametres", label: "Magasin", icon: Settings },
];

const mobileItems = [
  { href: "/pro", label: "Aujourd'hui", icon: Sun },
  { href: "/pro/offres", label: "Offres", icon: Tag },
  { href: "/pro/parametres", label: "Magasin", icon: Settings },
];

export function ProSidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-64 flex-col bg-ec-dark text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Logo inverted />
        <p className="mt-1 text-xs text-white/60">Pro · {PRO_SHOP_CITY} VD</p>
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
          {PRO_SHOP_NAME}
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ec-rule bg-ec-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch">
        {mobileItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/pro"
              ? pathname === "/pro"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition",
                active
                  ? "bg-ec-yellow text-ec-ink"
                  : "text-ec-muted hover:text-ec-ink"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
