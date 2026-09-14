import { Bell, Mail } from "lucide-react";
import { BottomNav } from "@/components/client/BottomNav";
import { SoftProfileCard } from "@/components/client/SoftProfileCard";
import { RiskBanner } from "@/components/client/RiskBanner";
import { Logo } from "@/components/Logo";
import { Card } from "@/components/ui/Card";

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
      </main>
      <BottomNav />
    </div>
  );
}
