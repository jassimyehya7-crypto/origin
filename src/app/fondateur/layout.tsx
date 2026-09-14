import { LiveRefresh } from "@/hooks/useLiveRefresh";
import { FounderSidebar } from "@/components/fondateur/FounderSidebar";
import { getLiveClients } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function FounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const live = await getLiveClients();
  return (
    <div className="flex min-h-dvh bg-ec-paper">
      <LiveRefresh
        types={["offers", "reservations", "shops", "presence", "scans"]}
      />
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-60">
        <FounderSidebar liveClients={live} />
      </div>
      <div className="w-full md:pl-60">
        <div className="flex items-center justify-between border-b border-ec-rule bg-ec-surface px-4 py-3 md:hidden">
          <div>
            <div className="text-sm font-extrabold text-ec-ink">Fondateur</div>
            <div className="text-xs font-semibold text-ec-muted">
              Villeneuve VD
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-ec-soft px-3 py-1 text-xs font-extrabold text-ec-green">
            <span className="live-dot h-2 w-2 rounded-full bg-ec-green" />
            {live} en ligne
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
