"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Sun, Tag, LayoutGrid, Plus } from "lucide-react";
import { Logo } from "../Logo";
import { cn } from "@/lib/utils";
import { PRO_SHOP_CITY, PRO_SHOP_NAME, PRO_SHOP_ID } from "@/lib/pro-shop";

const items = [
  { href: "/pro", label: "Aujourd'hui", icon: Sun },
  { href: "/pro/offres", label: "Offres", icon: Tag },
  { href: "/pro/parametres", label: "Magasin", icon: Settings },
];

/** Lightweight poll for pending reservation count */
function usePendingCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      try {
        const res = await fetch(
          `/api/reservations?shopId=${encodeURIComponent(PRO_SHOP_ID)}&status=EN_ATTENTE`,
          { credentials: "include", cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setCount(data.reservations?.length ?? 0);
        }
      } catch {
        /* silent */
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return count;
}

export function ProSidebar() {
  const pathname = usePathname();
  const pendingCount = usePendingCount();

  return (
    <aside className="flex h-full w-64 flex-col bg-ec-ink text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Logo inverted />
        <p className="mt-1 text-xs text-white/60">Pro · {PRO_SHOP_CITY}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/pro" ? pathname === "/pro" : pathname.startsWith(href);
          const showBadge = href === "/pro" && pendingCount > 0;
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
              <div className="relative">
                <Icon className="h-4 w-4" />
                {showBadge && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ec-yellow text-[9px] font-black text-ec-ink">
                    {pendingCount}
                  </span>
                )}
              </div>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-white/70">
          <LayoutGrid className="h-3.5 w-3.5" />
          {PRO_SHOP_NAME}
        </div>
      </div>
    </aside>
  );
}

/** Top tabs navigation for the new Pro layout */
export function ProTopTabs() {
  const pathname = usePathname();
  const pendingCount = usePendingCount();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/pro" ? pathname === "/pro" : pathname.startsWith(href);
        const showBadge = href === "/pro" && pendingCount > 0;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all duration-200",
              active
                ? "bg-ec-ink text-white shadow-sm"
                : "text-ec-muted hover:bg-ec-soft hover:text-ec-ink"
            )}
          >
            <div className="relative">
              <Icon className="h-4 w-4" />
              {showBadge && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-ec-red px-0.5 text-[9px] font-black text-white">
                  {pendingCount}
                </span>
              )}
            </div>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ProMobileNav() {
  const pathname = usePathname();
  const pendingCount = usePendingCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ec-rule bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/pro"
              ? pathname === "/pro"
              : pathname.startsWith(href);
          const showBadge = href === "/pro" && pendingCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition",
                active
                  ? "bg-ec-yellow text-ec-ink"
                  : "text-ec-muted hover:text-ec-ink"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                {showBadge && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ec-red px-0.5 text-[9px] font-black text-white">
                    {pendingCount}
                  </span>
                )}
              </div>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
