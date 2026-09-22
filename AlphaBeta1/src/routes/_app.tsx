import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SupabaseLoader } from "@/components/supabase-loader";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-dvh bg-paper">
      <SupabaseLoader />
      <div className="mx-auto min-h-dvh w-full max-w-lg bg-paper pb-nav md:max-w-3xl">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
