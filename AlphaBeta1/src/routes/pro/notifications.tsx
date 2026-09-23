import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Check, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/pro/notifications")({ component: ProNotifications });

function ProNotifications() {
  const [read, setRead] = useState(false);
  return <main className="px-5 pb-10 pt-5"><div className="flex items-end justify-between gap-3"><div><p className="text-sm text-mute">Épicerie Da Silva</p><h1 className="font-display text-2xl font-bold tracking-tight">Notifications</h1><p className="mt-1 text-sm text-mute">{read ? "Tout a été lu" : "1 alerte importante"}</p></div><button type="button" className="text-xs font-semibold text-mute" onClick={() => setRead(true)}>Tout lire</button></div><section className="mt-6 space-y-1"><Link to="/pro/orders" onClick={() => setRead(true)} className={`flex items-center gap-3 border-b border-line py-4 ${read ? "opacity-70" : ""}`}><span className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-deal/10 text-deal"><Bell className="size-5" /></span><span className="min-w-0 flex-1"><b className="block text-sm">Nouvelle demande à confirmer</b><small className="mt-1 block text-xs text-mute">Marie · Panier fruits du jour · il y a 2 min</small></span><ChevronRight className="size-4 text-mute" /></Link><div className="flex items-center gap-3 border-b border-line py-4 opacity-70"><span className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-ok/10 text-ok"><Check className="size-5" /></span><span><b className="block text-sm">Offre publiée</b><small className="mt-1 block text-xs text-mute">Votre offre est visible côté client.</small></span></div></section><div className="mt-8 rounded-[var(--radius-lg)] bg-soft px-4 py-4 text-sm text-mute">Les notifications push suivront les mêmes états : nouvelle demande, demande confirmée et commande prête au retrait.</div></main>;
}
