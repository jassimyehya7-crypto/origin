import Link from "next/link";
import { Bell, Mail, Store, Tablet } from "lucide-react";
import { BottomNav } from "@/components/client/BottomNav";
import { SoftProfileCard } from "@/components/client/SoftProfileCard";
import { RiskBanner } from "@/components/client/RiskBanner";
import { Logo } from "@/components/Logo";
import { ResetDemoButton } from "@/components/ResetDemoButton";
import { Card } from "@/components/ui/Card";
import { PRICING_NOTE } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default function ProfilPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-ec-paper">
      <header className="sticky top-0 z-30 border-b border-ec-rule bg-ec-surface px-4 py-4">
        <Logo size="sm" />
        <h1 className="mt-3 font-display text-2xl text-ec-ink">Profil</h1>
      </header>
      <main className="safe-pb space-y-4 px-4 pt-4">
        <RiskBanner />
        <SoftProfileCard />

        <Card>
          <h2 className="mb-3 font-extrabold text-ec-ink">
            Notifications (placeholders)
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-[14px] bg-ec-soft p-3">
              <Bell className="h-4 w-4 text-ec-ink" />
              <div>
                <div className="font-bold">Web push</div>
                <div className="text-xs font-semibold text-ec-muted">
                  Placeholder — pas d&apos;abonnement réel
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[14px] bg-ec-soft p-3">
              <Mail className="h-4 w-4 text-ec-ink" />
              <div>
                <div className="font-bold">Email</div>
                <div className="text-xs font-semibold text-ec-muted">
                  Placeholder — confirmation / refus simulés
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-2 font-extrabold text-ec-ink">Espaces métier</h2>
          <div className="space-y-2">
            <Link
              href="/pro"
              className="flex items-center gap-3 rounded-[14px] border border-ec-rule p-3 hover:bg-ec-soft"
            >
              <Store className="h-4 w-4 text-ec-ink" />
              <div>
                <div className="text-sm font-extrabold">Épicerie Club Pro</div>
                <div className="text-[11px] font-semibold text-ec-muted">
                  Interface commerçant (téléphone / tablette)
                </div>
              </div>
            </Link>
            <Link
              href="/fondateur"
              className="flex items-center gap-3 rounded-[14px] border border-ec-rule p-3 hover:bg-ec-soft"
            >
              <Tablet className="h-4 w-4 text-ec-ink" />
              <div>
                <div className="text-sm font-extrabold">Espace fondateur</div>
                <div className="text-[11px] font-semibold text-ec-muted">
                  Pilotage Villeneuve
                </div>
              </div>
            </Link>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ec-muted">
            {PRICING_NOTE}
          </p>
        </Card>

        <div className="flex justify-center">
          <ResetDemoButton />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
