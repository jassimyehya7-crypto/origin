"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function OffresToast() {
  const search = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const t = search.get("toast");
    if (t === "publiee") {
      setMsg("Offre publiée");
      router.replace("/pro/offres", { scroll: false });
      const id = window.setTimeout(() => setMsg(null), 2200);
      return () => window.clearTimeout(id);
    }
  }, [search, router]);

  if (!msg) return null;
  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ec-ink px-4 py-2 text-sm font-extrabold text-white shadow-lg">
      {msg}
    </div>
  );
}
