import { useEffect, useRef } from "react";
import { fetchMerchants, fetchOffers } from "@/lib/data/supabase-catalog";
import { setSupabaseMerchants, setSupabaseOffers } from "@/lib/data/catalog";
import { useAppStore } from "@/lib/store";

/**
 * Composant invisible qui charge les données Supabase au démarrage
 * et les injecte dans catalog.ts pour que toute l'app les utilise.
 * Doit être monté une seule fois dans le layout principal.
 */
export function SupabaseLoader() {
  const loaded = useRef(false);
  const setHydrated = useAppStore((s) => s.setHydrated);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    async function load() {
      try {
        const [merchants, offers] = await Promise.all([
          fetchMerchants(),
          fetchOffers(),
        ]);

        if (merchants.length > 0) {
          setSupabaseMerchants(merchants);
          console.log(`[Supabase] ${merchants.length} commerces chargés`);
        }
        if (offers.length > 0) {
          setSupabaseOffers(offers);
          console.log(`[Supabase] ${offers.length} offres chargées`);
        }
      } catch (err) {
        console.error("[Supabase] Erreur chargement:", err);
      } finally {
        setHydrated(true);
      }
    }

    load();
  }, [setHydrated]);

  return null;
}
