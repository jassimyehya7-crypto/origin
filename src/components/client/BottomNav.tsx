"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/reservations", label: "Réservations", icon: ShoppingBag },
  { href: "/favoris", label: "Favoris", icon: Heart },
  { href: "/profil", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ec-rule bg-white pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-3px_16px_rgba(17,24,32,0.06)]">
      <div className="mx-auto flex h-[82px] max-w-lg items-center justify-around px-4 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-16 min-w-[5rem] items-center justify-center rounded-[12px] py-2 text-[0px] font-bold transition",
                active
                  ? "text-ec-ink"
                  : "text-ec-muted hover:text-ec-ink"
              )}
            >
              <span className={cn("flex h-12 w-12 items-center justify-center rounded-[12px]", active && "bg-ec-yellow")}>
                <Icon className={cn("h-7 w-7", active && "stroke-[2.8]")} />
              </span>
              <span className="sr-only">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
