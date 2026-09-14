"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { StoreChannel } from "@/lib/store-events";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useSupabaseLive } from "./useSupabaseLive";

const DEFAULT_TYPES: StoreChannel[] = ["offers", "reservations", "shops"];

const TOAST: Partial<Record<StoreChannel, string>> = {
  offers: "Offres mises à jour",
  reservations: "Réservations mises à jour",
  shops: "Commerces mis à jour",
  presence: "Présence live",
  scans: "Funnel QR mis à jour",
};

const CHANNEL_TO_TABLE: Record<StoreChannel, string> = {
  offers: "ec_offers",
  reservations: "ec_reservations",
  shops: "ec_shops",
  presence: "ec_presence",
  scans: "ec_scans",
};

/**
 * Live subscription.
 * - Supabase env set → Realtime on ec_* (useSupabaseLive)
 * - Else → EventSource /api/events (local SSE)
 */
export function useLiveRefresh(opts?: {
  types?: StoreChannel[];
  toast?: boolean;
}) {
  const types = opts?.types ?? DEFAULT_TYPES;
  const showToast = opts?.toast !== false;
  const supabaseOn = isSupabaseConfigured();

  // Browser anon may only SELECT shops/offers after RLS lockdown
  const publicTypes = types.filter((t) => t === "offers" || t === "shops");
  const sb = useSupabaseLive({
    tables: (publicTypes.length ? publicTypes : (["offers", "shops"] as StoreChannel[])).map(
      (t) => CHANNEL_TO_TABLE[t]
    ),
    toast: showToast && supabaseOn,
  });

  const sse = useSseLive({
    types,
    toast: showToast && !supabaseOn,
    enabled: !supabaseOn,
  });

  return { message: supabaseOn ? sb.message : sse.message };
}

function useSseLive(opts: {
  types: StoreChannel[];
  toast: boolean;
  enabled: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const last = useRef(0);
  const typesKey = opts.types.join("|");

  useEffect(() => {
    if (!opts.enabled) return;
    const types = typesKey.split("|") as StoreChannel[];
    const es = new EventSource("/api/events");
    let hide: ReturnType<typeof setTimeout> | null = null;

    const onEvt = (type: StoreChannel) => {
      const now = Date.now();
      if (now - last.current >= 4000) {
        last.current = now;
        router.refresh();
      }
      if (opts.toast) {
        setMessage(TOAST[type] || "Mise à jour live");
        if (hide) clearTimeout(hide);
        hide = setTimeout(() => setMessage(null), 1800);
      }
    };

    const listeners: Array<[string, EventListener]> = [];
    for (const t of types) {
      const fn: EventListener = () => onEvt(t);
      es.addEventListener(t, fn);
      listeners.push([t, fn]);
    }

    return () => {
      for (const [t, fn] of listeners) es.removeEventListener(t, fn);
      es.close();
      if (hide) clearTimeout(hide);
    };
  }, [router, opts.enabled, opts.toast, typesKey]);

  return { message };
}

export function LiveRefresh({
  types,
  toast = true,
}: {
  types?: StoreChannel[];
  toast?: boolean;
}) {
  const { message } = useLiveRefresh({ types, toast });
  if (!message) return null;
  return (
    <div
      role="status"
      className="pointer-events-none fixed left-1/2 top-3 z-[70] -translate-x-1/2 rounded-full border border-ec-rule bg-ec-ink px-3 py-1.5 text-[11px] font-extrabold text-white shadow-soft"
    >
      <span className="live-dot mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ec-yellow" />
      {message}
    </div>
  );
}
