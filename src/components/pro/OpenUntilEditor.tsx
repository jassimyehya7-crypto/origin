"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function OpenUntilEditor({
  shopId,
  initial,
}: {
  shopId: string;
  initial: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/shops/${encodeURIComponent(shopId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ openUntil: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error || `Erreur ${res.status}`
        );
      }
      setMsg("Enregistré");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const dirty = value !== initial;

  return (
    <div className="min-w-0 space-y-3 overflow-hidden">
      <label className="block min-w-0 text-base font-extrabold text-ec-ink">
        Heure de fin
        <span className="mt-3 block min-w-0 w-full">
          <input
            type="time"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="box-border block h-14 w-full min-w-0 max-w-full rounded-[12px] border-2 border-ec-rule bg-ec-paper px-3 text-center text-xl font-extrabold tabular-nums text-ec-ink"
          />
        </span>
      </label>
      <p className="text-center text-sm font-semibold text-ec-muted">
        Fermeture de la PME à {value}.
      </p>
      {dirty && (
        <Button
          type="button"
          variant="confirm"
          className="h-14 w-full text-base font-extrabold"
          disabled={busy}
          onClick={() => void save()}
        >
          {busy ? "…" : "Enregistrer"}
        </Button>
      )}
      {msg && <p className="text-sm font-bold text-ec-green">{msg}</p>}
      {err && <p className="text-sm font-bold text-ec-red">{err}</p>}
    </div>
  );
}
