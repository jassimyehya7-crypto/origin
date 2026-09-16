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
      <header className="sticky top-0 z-30 bg-white px-4 py-4">
        <Logo size="sm" />
        <h1 className="mt-5 text-center text-2xl font-black text-ec-ink">
          Mes réservations
        </h1>
        <p className="mt-1 text-center text-xs font-semibold text-ec-muted">
          Retrouvez ici vos offres réservées.
        </p>
      </header>
      <main className="pt-4">
        <MyReservations tab={tab} />
      </main>
      <BottomNav />
    </div>
  );
}
