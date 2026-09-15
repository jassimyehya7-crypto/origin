"use client";

import { usePathname } from "next/navigation";
import { LiveRefresh } from "@/hooks/useLiveRefresh";
import { Logo } from "@/components/Logo";
import { ProMobileNav, ProSidebar } from "@/components/pro/ProSidebar";

export function ProChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/pro/login")) {
    return <>{children}</>;
  }
  return (
    <div className="flex min-h-dvh bg-ec-paper">
      <LiveRefresh types={["offers", "reservations", "shops"]} />
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <ProSidebar />
      </div>
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col lg:mx-0 lg:max-w-none lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-ec-rule bg-ec-surface px-4 py-3 lg:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <Logo size="sm" withText={false} />
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold tracking-tight text-ec-ink">
                épicerie.club
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </div>
        <ProMobileNav />
      </div>
    </div>
  );
}
