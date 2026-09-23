import { useEffect } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SupabaseLoader } from "@/components/supabase-loader";
import { useAppStore } from "@/lib/store";
import { initialAuthRedirect, supabase } from "@/lib/supabase";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "OffresLocal";

function HydrateStore() {
  useEffect(() => {
    void useAppStore.persist.rehydrate();
    useAppStore.getState().setHydrated(true);
  }, []);
  return null;
}

function InviteRedirect() {
  useEffect(() => {
    if (!initialAuthRedirect || !supabase) return;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const founder = await supabase!.rpc("founder_access_for_user");
      if (founder.data === true) window.location.replace("/fondateur");
    });
  }, []);
  return null;
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#EAFF4F" },
      {
        name: "description",
        content:
          "Offres des commerces de Villeneuve — réservation gratuite, code de retrait, pas de paiement en ligne.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&family=Syne:wght@600;700;800&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="fr" suppressHydrationWarning className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body className="bg-paper text-ink">
        <PreviewHostBridge />
        <AuthProvider>
          <HydrateStore />
          <InviteRedirect />
          <SupabaseLoader />
          <Outlet />
          <Toaster
            position="top-center"
            toastOptions={{
              className:
                "font-sans !bg-ink !text-paper !border-0 !rounded-full !px-4 !shadow-[var(--shadow-float)]",
            }}
          />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
