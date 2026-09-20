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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ec-rule bg-white">
      <div className="mx-auto flex h-12 max-w-lg items-center justify-around px-6">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center justify-center text-[0px] font-bold transition",
                active ? "text-ec-ink" : "text-ec-muted"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-[9px]",
                  active && "bg-ec-yellow"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.6]")} />
              </span>
              <span className="sr-only">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
