"use client";

import { useState } from "react";
import { PRO_SHOP_ID } from "@/lib/pro-shop";
import { MessageCircle, Send, CheckCircle } from "lucide-react";

export function ContactSupportModule() {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!body.trim()) {
      setErr("Écrivez votre demande.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const form = new FormData();
      form.set("shopId", PRO_SHOP_ID);
      form.set("body", body.trim());
      const res = await fetch("/api/pro/founder-message", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Erreur");
      }
      setSent(true);
      setBody("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-ec-rule bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-ec-muted" />
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-ec-muted">
            Support
          </h2>
        </div>
        <div className="mt-4 flex flex-col items-center py-6 text-center">
          <CheckCircle className="mb-3 h-10 w-10 text-ec-green" />
          <p className="text-base font-extrabold text-ec-ink">Demande envoyée</p>
          <p className="mt-2 text-sm font-semibold text-ec-muted">
            Nous vous revenons sous 24h à 72h.
          </p>
          <button
            type="button"
            onClick={() => { setSent(false); setErr(null); }}
            className="mt-4 rounded-xl border border-ec-rule px-4 py-2 text-xs font-bold text-ec-muted transition hover:bg-ec-soft hover:text-ec-ink"
          >
            Envoyer un autre message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ec-rule bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-ec-muted" />
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ec-muted">
          Support
        </h2>
      </div>

      {!open ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-ec-muted">
            Une question, un problème ou une suggestion ?
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-ec-ink bg-white text-sm font-extrabold text-ec-ink transition active:scale-[0.99] hover:bg-ec-ink hover:text-white"
          >
            <MessageCircle className="h-4 w-4" />
            Contacter l'équipe OffresLocal
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Décrivez votre demande…"
            autoFocus
            className="box-border block w-full resize-none rounded-xl border-2 border-ec-rule bg-white px-4 py-3 text-sm font-semibold text-ec-ink placeholder:text-ec-muted outline-none focus:border-ec-blue focus:ring-1 focus:ring-ec-blue"
          />
          {err && <p className="text-sm font-bold text-ec-red">{err}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setErr(null); }}
              disabled={busy}
              className="flex h-11 flex-1 items-center justify-center rounded-xl border border-ec-rule text-sm font-extrabold text-ec-ink transition active:scale-[0.98]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ec-green text-sm font-extrabold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {busy ? "…" : "Envoyer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
