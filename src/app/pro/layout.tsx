import { LiveRefresh } from "@/hooks/useLiveRefresh";
import { ProMobileNav, ProSidebar } from "@/components/pro/ProSidebar";

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-ec-paper">
      <LiveRefresh types={["offers", "reservations", "shops"]} />
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <ProSidebar />
      </div>
      <div className="flex min-h-dvh w-full flex-col lg:pl-64">
        <div className="border-b border-ec-rule bg-ec-surface px-4 py-3 lg:hidden">
          <div className="text-sm font-extrabold text-ec-ink">
            Épicerie Club Pro
          </div>
          <div className="text-xs font-semibold text-ec-muted">
            Da Silva · Villeneuve
          </div>
        </div>
        <div className="flex-1 pb-20 lg:pb-0">{children}</div>
        <ProMobileNav />
      </div>
    </div>
  );
}
