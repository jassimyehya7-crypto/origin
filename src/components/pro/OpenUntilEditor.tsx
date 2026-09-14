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
    <div className="space-y-3">
      <label className="block text-sm font-extrabold text-ec-ink">
        Heure de fin
        <input
          type="time"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-2 block w-full rounded-[12px] border border-ec-rule bg-ec-paper px-3 py-3 text-base font-semibold text-ec-ink"
        />
      </label>
      <p className="text-sm font-semibold text-ec-muted">
        Fin de journée automatique à {value}. À cette heure, les réservations
        non retirées passent en terminées et le stock revient.
      </p>
      {dirty && (
        <Button
          type="button"
          variant="confirm"
          className="h-12 w-full font-extrabold"
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
