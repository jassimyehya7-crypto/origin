"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PRO_SHOP_ID } from "@/lib/pro-shop";

export function FounderContactModule({ shopId = PRO_SHOP_ID }: { shopId?: string }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopTracks();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopTracks() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function clearAudio() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
  }

  function closeSheet() {
    if (recording) {
      mediaRef.current?.stop();
      setRecording(false);
    }
    stopTracks();
    setOpen(false);
    setErr(null);
  }

  async function startRecording() {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      mediaRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        clearAudio();
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stopTracks();
        setRecording(false);
      };
      recorder.start();
      setRecording(true);
    } catch {
      setErr("Micro inaccessible — autorisez le micro ou écrivez un message.");
    }
  }

  function stopRecording() {
    const rec = mediaRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    } else {
      setRecording(false);
      stopTracks();
    }
  }

  async function submit() {
    const text = body.trim();
    if (!text && !audioBlob) {
      setErr("Écrivez un message ou enregistrez un audio.");
      return;
    }
    setBusy(true);
    setErr(null);
    setOk(false);
    try {
      const form = new FormData();
      form.set("shopId", shopId);
      if (text) form.set("body", text);
      if (audioBlob) {
        const ext = audioBlob.type.includes("mp4")
          ? "m4a"
          : audioBlob.type.includes("ogg")
            ? "ogg"
            : "webm";
        form.set("audio", audioBlob, `message.${ext}`);
      }
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
      clearAudio();
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
      <h2 className="text-base font-extrabold text-ec-ink">
        Joindre le fondateur
      </h2>
      <p className="text-sm font-semibold leading-relaxed text-ec-muted">
        Question, problème ou idée — texte ou message vocal.
      </p>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setErr(null);
          setOk(false);
        }}
        className="flex min-h-14 w-full min-w-0 items-center justify-center rounded-[12px] border-2 border-ec-ink bg-ec-surface px-4 py-3 text-base font-extrabold text-ec-ink transition active:scale-[0.99]"
      >
        Écrire / enregistrer
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
          <div className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[20px] border border-ec-rule bg-ec-paper sm:rounded-[20px]">
            <div className="flex items-center justify-between gap-3 border-b border-ec-rule px-4 py-3">
              <h3 className="min-w-0 truncate text-base font-extrabold text-ec-ink">
                Joindre le fondateur
              </h3>
              <button
                type="button"
                onClick={closeSheet}
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[12px] text-sm font-extrabold text-ec-muted"
              >
                Fermer
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-extrabold text-ec-ink">
                  Écrire votre demande
                </span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="Votre message…"
                  className="box-border block w-full min-w-0 resize-none rounded-[12px] border-2 border-ec-rule bg-ec-surface px-3 py-3 text-base font-semibold text-ec-ink placeholder:text-ec-muted"
                />
              </label>

              <div className="min-w-0 space-y-2">
                <span className="block text-sm font-extrabold text-ec-ink">
                  Audio (optionnel)
                </span>
                {!recording && !audioBlob && (
                  <button
                    type="button"
                    onClick={() => void startRecording()}
                    className="flex min-h-14 w-full items-center justify-center rounded-[12px] border-2 border-ec-rule bg-ec-soft px-4 text-base font-extrabold text-ec-ink active:scale-[0.99]"
                  >
                    Enregistrer
                  </button>
                )}
                {recording && (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex min-h-14 w-full items-center justify-center rounded-[12px] border-2 border-ec-red bg-[#FDECEA] px-4 text-base font-extrabold text-ec-red active:scale-[0.99]"
                  >
                    Arrêter
                  </button>
                )}
                {audioBlob && audioUrl && (
                  <div className="space-y-2 rounded-[12px] border border-ec-rule bg-ec-surface p-3">
                    <audio controls src={audioUrl} className="w-full" />
                    <button
                      type="button"
                      onClick={clearAudio}
                      className="min-h-11 w-full rounded-[12px] text-sm font-extrabold text-ec-muted"
                    >
                      Supprimer l’audio
                    </button>
                  </div>
                )}
              </div>

              {err && <p className="text-sm font-bold text-ec-red">{err}</p>}
              {ok && (
                <p className="text-sm font-bold text-ec-green">Envoyé</p>
              )}
            </div>

            <div className="border-t border-ec-rule px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <Button
                type="button"
                variant="confirm"
                className="h-14 w-full text-base font-extrabold"
                disabled={busy || recording}
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
