"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LayoutDashboard, Store } from "lucide-react";
import { Logo } from "../Logo";
import { cn } from "@/lib/utils";

const items = [
  { href: "/fondateur", label: "Pilotage", icon: LayoutDashboard },
];

export function FounderSidebar({ liveClients }: { liveClients: number }) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-60 flex-col bg-ec-dark text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Logo inverted />
        <p className="mt-1 text-xs text-white/60">Espace fondateur</p>
      </div>
      <div className="m-3 rounded-2xl bg-white/10 p-3">
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className="live-dot inline-block h-2 w-2 rounded-full bg-ec-leaf" />
          Clients connectés
        </div>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-3xl font-bold">{liveClients}</span>
          <Activity className="mb-1 h-4 w-4 text-ec-leaf" />
        </div>
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
        <Link href="/pro" className="block text-ec-leaf hover:underline">
          Ouvrir Pro →
        </Link>
        <Link href="/" className="mt-1 block text-ec-leaf hover:underline">
          Feed client →
        </Link>
      </div>
    </aside>
  );
}
