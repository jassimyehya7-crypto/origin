"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Shop, TabletRequestStatus } from "@/lib/types";

export function ShopOpsControls({ shop }: { shop: Shop }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setErr(null);
    try {
      const res = await fetch(
        `/api/founder/shops/${encodeURIComponent(shop.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error || `Erreur ${res.status}`
        );
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  const status: TabletRequestStatus = shop.tabletRequestStatus;
  const canValidate = status === "pending" || status === "none";
  const canMarkInstalled =
    status === "pending" || status === "approved" || status === "none";

  return (
    <div className="mt-3 min-w-0 space-y-2 overflow-hidden border-t border-ec-rule pt-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-extrabold uppercase text-ec-muted">
          Abonnement
        </span>
        <Button
          type="button"
          size="sm"
          variant={shop.subscriptionActive ? "outline" : "confirm"}
          disabled={busy !== null}
          className="min-h-11 px-3 font-extrabold"
          onClick={() =>
            void patch(
              { subscriptionActive: !shop.subscriptionActive },
              "abo"
            )
          }
        >
          {busy === "abo"
            ? "…"
            : shop.subscriptionActive
              ? "Passer inactif"
              : "Activer abo"}
        </Button>
      </div>
      <p
        className={`text-sm font-extrabold ${
          shop.subscriptionActive ? "text-ec-green" : "text-ec-red"
        }`}
      >
        {shop.subscriptionActive ? "Abo actif" : "Abo inactif"}
      </p>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-xs font-extrabold uppercase text-ec-muted">
          Tablette · {status}
        </span>
        <div className="flex flex-wrap gap-2">
          {canValidate && (
            <Button
              type="button"
              size="sm"
              variant="confirm"
              disabled={busy !== null}
              className="min-h-11 px-3 font-extrabold"
              onClick={() =>
                void patch({ tabletRequestStatus: "approved" }, "valider")
              }
            >
              {busy === "valider" ? "…" : "Valider"}
            </Button>
          )}
          {canMarkInstalled && (
            <Button
              type="button"
              size="sm"
              variant="primary"
              disabled={busy !== null}
              className="min-h-11 px-3 font-extrabold"
              onClick={() =>
                void patch({ tabletRequestStatus: "installed" }, "installee")
              }
            >
              {busy === "installee" ? "…" : "Installée"}
            </Button>
          )}
        </div>
      </div>
      {err && <p className="text-sm font-bold text-ec-red">{err}</p>}
    </div>
  );
}
