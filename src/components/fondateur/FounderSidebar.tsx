"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store } from "lucide-react";
import { Logo } from "../Logo";
import { cn } from "@/lib/utils";

const items = [
  { href: "/fondateur", label: "Pilotage", icon: LayoutDashboard },
];
const appUrl = process.env.NEXT_PUBLIC_CLIENT_APP_URL || "http://localhost:5191";

export function FounderSidebar({ liveClients }: { liveClients: number }) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-60 flex-col bg-ec-dark text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Logo inverted />
        <p className="mt-1 text-xs text-white/60">Espace fondateur</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
              pathname === href
                ? "bg-white/15"
                : "text-white/70 hover:bg-white/10"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4 text-xs text-white/50">
        <div className="mb-2 flex items-center gap-2">
          <Store className="h-3.5 w-3.5" />
          Zone : Villeneuve VD
        </div>
        <a href={`${appUrl}/pro`} className="block text-ec-leaf hover:underline">
          Ouvrir Pro →
        </a>
        <a href={appUrl} className="mt-1 block text-ec-leaf hover:underline">
          Feed client →
        </a>
      </div>
    </aside>
  );
}
