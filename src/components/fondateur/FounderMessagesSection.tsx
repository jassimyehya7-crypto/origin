"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { FounderMessage, FounderMessageStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const STATUS_LABEL: Record<FounderMessageStatus, string> = {
  nouveau: "Nouveau",
  lu: "Lu",
  traite: "Traité",
};

export function FounderMessagesSection({
  messages,
}: {
  messages: FounderMessage[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function setStatus(id: string, status: FounderMessageStatus) {
    setBusy(`${id}:${status}`);
    setErr(null);
    try {
      const res = await fetch(
        `/api/founder/messages/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status }),
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

  return (
    <section className="mb-6">
      <h2 className="mb-3 text-sm font-extrabold text-ec-ink">
        Messages commerçants
      </h2>
      {messages.length === 0 ? (
        <div className="ec-corner-cut border border-ec-rule bg-ec-surface p-4 text-sm font-semibold text-ec-muted">
          Aucun message
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className="ec-corner-cut min-w-0 overflow-hidden border border-ec-rule bg-ec-surface p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-ec-ink">
                    {m.shopName || m.shopId}
                  </p>
                  <p className="text-[11px] font-semibold text-ec-muted">
                    {formatDateTime(m.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-ec-paper px-2 py-0.5 text-[10px] font-extrabold uppercase text-ec-muted">
                  {STATUS_LABEL[m.status]}
                </span>
              </div>
              {m.body && (
                <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-ec-ink">
                  {m.body}
                </p>
              )}
              {m.audioUrl && (
                <audio
                  controls
                  src={m.audioUrl}
                  className="mt-3 w-full min-w-0"
                  preload="metadata"
                />
              )}
              <div className="mt-3 flex min-w-0 flex-wrap gap-2 border-t border-ec-rule pt-3">
                {m.status === "nouveau" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-11 flex-1 font-extrabold"
                    disabled={busy !== null}
                    onClick={() => void setStatus(m.id, "lu")}
                  >
                    {busy === `${m.id}:lu` ? "…" : "Marquer lu"}
                  </Button>
                )}
                {m.status !== "traite" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="confirm"
                    className="min-h-11 flex-1 font-extrabold"
                    disabled={busy !== null}
                    onClick={() => void setStatus(m.id, "traite")}
                  >
                    {busy === `${m.id}:traite` ? "…" : "Traité"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {err && <p className="mt-2 text-sm font-bold text-ec-red">{err}</p>}
    </section>
  );
}
