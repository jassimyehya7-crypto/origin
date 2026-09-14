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

/** Min gap between full-page refreshes (ms). Short gaps feel laggy on mobile. */
const REFRESH_GAP_MS = 4000;
const INTERACTION_PAUSE_MS = 1200;

/**
 * Supabase Realtime → debounced router.refresh().
 * Skips refresh while the user is tapping/scrolling (avoids wrong-card navigations).
 */
export function useSupabaseLive(opts?: {
  tables?: string[];
  toast?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const lastRefresh = useRef(0);
  const lastInteract = useRef(0);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = opts?.toast !== false;
  const tablesKey = (opts?.tables ?? [...DEFAULT_TABLES]).join("|");
  const enabled = isSupabaseConfigured();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mark = () => {
      lastInteract.current = Date.now();
    };
    window.addEventListener("pointerdown", mark, { passive: true });
    window.addEventListener("touchstart", mark, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("touchstart", mark);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const supabase = createBrowserClient();
    if (!supabase) return;

    const tables = tablesKey.split("|");
    let hide: ReturnType<typeof setTimeout> | null = null;

    const doRefresh = () => {
      const now = Date.now();
      if (now - lastInteract.current < INTERACTION_PAUSE_MS) {
        if (pending.current) clearTimeout(pending.current);
        pending.current = setTimeout(doRefresh, INTERACTION_PAUSE_MS);
        return;
      }
      if (now - lastRefresh.current < REFRESH_GAP_MS) return;
      lastRefresh.current = now;
      router.refresh();
    };

    const onEvent = (table: string) => {
      if (showToast) {
        setMessage(TABLE_TOAST[table] || "Mise à jour live");
        if (hide) clearTimeout(hide);
        hide = setTimeout(() => setMessage(null), 1800);
      }
      if (pending.current) clearTimeout(pending.current);
      pending.current = setTimeout(doRefresh, 400);
    };

    let channel = supabase.channel("ec-live");
    for (const table of tables) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => onEvent(table)
      );
    }
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (hide) clearTimeout(hide);
      if (pending.current) clearTimeout(pending.current);
    };
  }, [router, showToast, tablesKey, enabled]);

  return { message, enabled };
}
