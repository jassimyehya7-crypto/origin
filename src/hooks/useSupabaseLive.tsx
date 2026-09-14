"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const TABLE_TOAST: Record<string, string> = {
  ec_offers: "Offres mises à jour",
  ec_reservations: "Réservations mises à jour",
  ec_shops: "Commerces mis à jour",
  ec_presence: "Présence live",
  ec_scans: "Funnel QR mis à jour",
};

const DEFAULT_TABLES = ["ec_offers", "ec_shops"] as const;

/**
 * Supabase Realtime → router.refresh().
 * Subscribe to postgres_changes on ec_* tables.
 */
export function useSupabaseLive(opts?: {
  tables?: string[];
  toast?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const last = useRef(0);
  const showToast = opts?.toast !== false;
  const tablesKey = (opts?.tables ?? [...DEFAULT_TABLES]).join("|");
  const enabled = isSupabaseConfigured();

  useEffect(() => {
    if (!enabled) return;
    const supabase = createBrowserClient();
    if (!supabase) return;

    const tables = tablesKey.split("|");
    let hide: ReturnType<typeof setTimeout> | null = null;

    const refresh = (table: string) => {
      const now = Date.now();
      if (now - last.current >= 350) {
        last.current = now;
        router.refresh();
      } else {
        last.current = now;
      }
      if (showToast) {
        setMessage(TABLE_TOAST[table] || "Mise à jour live");
        if (hide) clearTimeout(hide);
        hide = setTimeout(() => setMessage(null), 2200);
      }
    };

    let channel = supabase.channel("ec-live");
    for (const table of tables) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => refresh(table)
      );
    }
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (hide) clearTimeout(hide);
    };
  }, [router, showToast, tablesKey, enabled]);

  return { message, enabled };
}
