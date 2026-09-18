"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PRO_SHOP_ID } from "@/lib/pro-shop";

export function FounderContactModule({ shopId = PRO_SHOP_ID }: { shopId?: string }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function closeSheet() {
    setOpen(false);
    setErr(null);
  }

  async function submit() {
    const text = body.trim();
    if (!text) {
      setErr("Écrivez un message.");
      return;
    }
    setBusy(true);
    setErr(null);
    setOk(false);
    try {
      const form = new FormData();
      form.set("shopId", shopId);
      form.set("body", text);
      const res = await fetch("/api/pro/founder-message", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error || `Erreur ${res.status}`
        );
      }
      setBody("");
      setOk(true);
      setTimeout(() => {
        setOpen(false);
        setOk(false);
      }, 900);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0 space-y-3 overflow-hidden">
      <p className="text-sm font-semibold leading-relaxed text-ec-muted">
        Question, problème ou idée — envoyez un message au fondateur.
      </p>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setErr(null);
          setOk(false);
        }}
        className="flex min-h-12 w-full min-w-0 items-center justify-center rounded-xl border-2 border-ec-ink bg-white px-4 py-3 text-sm font-extrabold text-ec-ink transition active:scale-[0.99]"
      >
        Écrire au fondateur
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ec-ink/40 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Joindre le fondateur"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSheet();
          }}
        >
          <div className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-ec-rule bg-ec-paper sm:rounded-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-ec-rule px-4 py-3">
              <h3 className="min-w-0 truncate text-base font-extrabold text-ec-ink">
                Joindre le fondateur
              </h3>
              <button
                type="button"
                onClick={closeSheet}
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-ec-muted"
              >
                Fermer
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-extrabold text-ec-ink">
                  Votre message
                </span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="Décrivez votre question ou idée…"
                  className="box-border block w-full min-w-0 resize-none rounded-xl border-2 border-ec-rule bg-white px-3 py-3 text-base font-semibold text-ec-ink placeholder:text-ec-muted"
                  autoFocus
                />
              </label>

              {err && <p className="text-sm font-bold text-ec-red">{err}</p>}
              {ok && (
                <p className="text-sm font-bold text-ec-green">Envoyé ✓</p>
              )}
            </div>

            <div className="border-t border-ec-rule px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <Button
                type="button"
                variant="confirm"
                className="h-12 w-full text-base font-extrabold"
                disabled={busy}
                onClick={() => void submit()}
              >
                {busy ? "…" : "Envoyer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
