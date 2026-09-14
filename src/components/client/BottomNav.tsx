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
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-1">
      <div className="mx-auto flex max-w-lg items-stretch justify-around rounded-[18px] border border-ec-rule bg-ec-surface p-1.5 shadow-soft">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[4.5rem] flex-col items-center gap-0.5 rounded-[13px] py-2 text-[10px] font-bold transition",
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
