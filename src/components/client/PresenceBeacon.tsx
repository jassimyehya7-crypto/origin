"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getSessionId() {
  if (typeof window === "undefined") return "ssr";
  const key = "ec_session";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `live_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function PresenceBeacon() {
  const pathname = usePathname();
  const sid = useRef<string>("");

  useEffect(() => {
    sid.current = getSessionId();
    const ping = () => {
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid.current, page: pathname }),
      }).catch(() => {});
    };
    ping();
    const t = setInterval(ping, 20000);
    return () => clearInterval(t);
  }, [pathname]);

  return null;
}
