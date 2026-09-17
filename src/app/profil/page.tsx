import { Bell, ChevronRight, CircleHelp, FileText, Globe2, LogOut, PiggyBank } from "lucide-react";
import { BottomNav } from "@/components/client/BottomNav";
import { SoftProfileCard } from "@/components/client/SoftProfileCard";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

const rows = [
  { icon: Bell, title: "Mes notifications", text: "Gérez vos préférences de notification" },
  { icon: Globe2, title: "Langue", text: "Choisissez la langue de l'application" },
  { icon: CircleHelp, title: "Centre d'aide", text: "Questions fréquentes et assistance" },
  { icon: FileText, title: "Conditions d'utilisation", text: "Consultez nos conditions" },
];

export default function ProfilPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-white">
      <header className="px-4 py-4"><Logo size="sm" /></header>
      <main className="safe-pb space-y-3 px-4">
        <div>
          <h1 className="text-2xl font-black text-ec-ink">Mon compte</h1>
          <p className="text-xs font-semibold text-ec-muted">Gérez vos informations et vos préférences.</p>
        </div>
        <section className="flex items-center gap-3 rounded-xl bg-[#f7ffe2] p-4">
          <PiggyBank className="h-12 w-12 text-ec-ink" />
          <div className="flex-1"><p className="text-sm font-black">Économisé avec<br />OffresLocal</p><p className="text-[10px] text-ec-muted">Grâce aux offres des commerçants</p></div>
          <div className="text-right"><strong className="rounded bg-ec-yellow px-2 py-1 text-lg">0.00 CHF</strong><p className="mt-1 text-[9px] text-ec-muted">d&apos;économies réalisées</p></div>
        </section>
        <SoftProfileCard />
        <div className="overflow-hidden rounded-xl border border-ec-rule">
          {rows.map(({ icon: Icon, title, text }) => <div key={title} className="flex items-center gap-3 border-b border-ec-rule px-4 py-3 last:border-0"><Icon className="h-5 w-5 text-[#112675]" /><div className="flex-1"><p className="text-xs font-black">{title}</p><p className="text-[9px] text-ec-muted">{text}</p></div><ChevronRight className="h-4 w-4" /></div>)}
        </div>
        <button className="flex w-full items-center gap-3 rounded-xl bg-rose-50 px-4 py-4 text-left text-xs font-black text-rose-500"><LogOut className="h-5 w-5" /> Se déconnecter <ChevronRight className="ml-auto h-4 w-4" /></button>
      </main>
      <BottomNav />
    </div>
  );
}
