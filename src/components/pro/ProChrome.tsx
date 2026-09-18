"use client";

import { usePathname } from "next/navigation";
import { LiveRefresh } from "@/hooks/useLiveRefresh";
import { Logo } from "@/components/Logo";
import { ProMobileNav, ProSidebar, ProTopTabs } from "@/components/pro/ProSidebar";
import { PRO_SHOP_NAME, PRO_SHOP_CITY } from "@/lib/pro-shop";

export function ProChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/pro/login")) {
    return <>{children}</>;
  }
  return (
    <div className="flex min-h-dvh bg-ec-paper">
      <LiveRefresh types={["offers", "reservations", "shops"]} />

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <ProSidebar />
      </div>

      {/* Main content */}
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col lg:mx-0 lg:max-w-none lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-ec-rule bg-ec-paper/80 backdrop-blur-xl">
          {/* Mobile: compact header with logo only */}
          <div className="px-4 py-3 lg:hidden">
            <Logo size="sm" />
          </div>

          {/* Desktop: shop info + tabs */}
          <div className="hidden lg:block lg:px-5 lg:pb-3 lg:pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ec-yellow text-sm font-black text-ec-ink">
                {PRO_SHOP_NAME.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-extrabold text-ec-ink leading-tight">{PRO_SHOP_NAME}</p>
                <p className="text-[11px] font-semibold text-ec-muted">{PRO_SHOP_CITY}</p>
              </div>
            </div>
            <div className="mt-3">
              <ProTopTabs />
            </div>
          </div>
        </header>

        <div className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
          {children}
        </div>
        <ProMobileNav />
      </div>
    </div>
  );
}
