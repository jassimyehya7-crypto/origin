"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

export function LiveCounter({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    setCount(initial);
  }, [initial]);

  return (
    <div className="rounded-[20px] border border-ec-rule bg-ec-surface p-4">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-ec-muted">
        <span className="live-dot inline-block h-2.5 w-2.5 rounded-full bg-ec-green" />
        Clients connectés
      </div>
      <div className="mt-1 flex items-end gap-3">
        <span className="text-5xl font-black text-ec-ink">{count}</span>
        <Activity className="mb-2 h-5 w-5 text-ec-green" />
      </div>
      <p className="mt-1 text-[11px] font-semibold text-ec-muted">
        Canal presence · live
      </p>
    </div>
  );
}
