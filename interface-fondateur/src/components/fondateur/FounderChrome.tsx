"use client";

import { usePathname } from "next/navigation";
import { FounderSidebar } from "@/components/fondateur/FounderSidebar";

export function FounderChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/fondateur/login")) {
    return <>{children}</>;
  }
  return (
    <div className="flex min-h-dvh bg-ec-paper">
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-60">
        <FounderSidebar />
      </div>
      <div className="w-full md:pl-60">
        <div className="flex items-center justify-between border-b border-ec-rule bg-ec-surface px-4 py-3 md:hidden">
          <div>
            <div className="text-sm font-extrabold text-ec-ink">Fondateur</div>
            <div className="text-xs font-semibold text-ec-muted">
              Villeneuve VD
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
