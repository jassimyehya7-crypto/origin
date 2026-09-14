import { BottomNav } from "@/components/client/BottomNav";
import { MyReservations } from "@/components/client/MyReservations";
import { LiveRefresh } from "@/hooks/useLiveRefresh";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default function ReservationsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab = searchParams.tab === "historique" ? "historique" : "avenir";

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-ec-paper">
      <LiveRefresh />
      <header className="sticky top-0 z-30 border-b border-ec-rule bg-ec-surface px-4 py-4">
        <Logo size="sm" />
        <h1 className="mt-3 font-display text-2xl text-ec-ink">
          Vos réservations.
        </h1>
        <p className="mt-1 text-sm font-semibold text-ec-muted">
          Présentez le code au commerçant avant l&apos;heure indiquée.
        </p>
      </header>
      <main className="pt-4">
        <MyReservations tab={tab} />
      </main>
      <BottomNav />
    </div>
  );
}
