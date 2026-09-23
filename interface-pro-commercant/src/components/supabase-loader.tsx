import { useEffect } from "react";
import { fetchMerchants, fetchOffers, fetchClientReservations } from "@/lib/data/supabase-catalog";
import { setSupabaseMerchants, setSupabaseOffers } from "@/lib/data/catalog";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

/**
 * Composant invisible qui charge les données Supabase au démarrage
 * et les injecte dans catalog.ts pour que toute l'app les utilise.
 * Doit être monté une seule fois dans le layout principal.
 */
export function SupabaseLoader() {
  const setHydrated = useAppStore((s) => s.setHydrated);
  const setSyncStatus = useAppStore((s) => s.setSyncStatus);
  const syncRemoteStocks = useAppStore((s) => s.syncRemoteStocks);
  const syncRemoteReservations = useAppStore((s) => s.syncRemoteReservations);

  useEffect(() => {
    let active = true;
    let refreshTimer: number | undefined;

    async function load(showSyncing = false) {
      if (showSyncing) setSyncStatus("syncing");
      try {
        const requestIds = useAppStore.getState().reservations
          .filter((reservation) => reservation.mine && reservation.requestId)
          .map((reservation) => reservation.requestId!);
        const [merchants, offers, reservations] = await Promise.all([
          fetchMerchants(),
          fetchOffers(),
          fetchClientReservations(requestIds),
        ]);

        if (!active) return;
        if (supabase) {
          setSupabaseMerchants(merchants);
          setSupabaseOffers(offers);
          syncRemoteStocks(offers);
        }
        if (supabase) syncRemoteReservations(reservations);
        setSyncStatus(supabase ? "live" : "offline");
      } catch (err) {
        console.error("[Supabase] Erreur chargement:", err);
        if (active) setSyncStatus("offline");
      } finally {
        if (active) setHydrated(true);
      }
    }

    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => void load(), 120);
    };

    void load(true);
    const poll = window.setInterval(() => void load(), 5000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    document.addEventListener("visibilitychange", onVisibility);

    const channel = supabase
      ?.channel("offreslocal-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "ec_offers" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "ec_shops" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "ec_reservations" }, scheduleRefresh)
      .subscribe((status) => {
        // Une connexion Realtime seule ne prouve pas que le catalogue a été lu.
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setSyncStatus("offline");
      });

    return () => {
      active = false;
      window.clearTimeout(refreshTimer);
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisibility);
      if (channel && supabase) void supabase.removeChannel(channel);
    };
  }, [setHydrated, setSyncStatus, syncRemoteReservations, syncRemoteStocks]);

  return null;
}
