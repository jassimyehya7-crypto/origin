"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleX, LoaderCircle } from "lucide-react";

export function PickupScanResult({ token }: { token: string }) {
  const started = useRef(false);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Validation sécurisée du retrait…");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetch("/api/pro/pickup/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "QR non valide");
        setState("ok");
        setMessage("Retrait validé. Le QR est maintenant désactivé.");
      })
      .catch((error: Error) => {
        setState("error");
        setMessage(error.message);
      });
  }, [token]);

  return (
    <main className="mx-auto flex min-h-[75dvh] max-w-md items-center px-5 py-10">
      <section className="w-full rounded-3xl border border-ec-rule bg-white p-7 text-center shadow-sm">
        {state === "loading" ? <LoaderCircle className="mx-auto h-16 w-16 animate-spin text-ec-ink" /> : null}
        {state === "ok" ? <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" /> : null}
        {state === "error" ? <CircleX className="mx-auto h-16 w-16 text-rose-500" /> : null}
        <h1 className="mt-5 text-2xl font-black text-ec-ink">
          {state === "ok" ? "Retrait confirmé" : state === "error" ? "QR refusé" : "Un instant"}
        </h1>
        <p className="mt-2 text-sm font-semibold text-ec-muted">{message}</p>
        <Link href="/pro" className="mt-7 inline-flex rounded-xl bg-ec-yellow px-5 py-3 text-sm font-black text-ec-ink">
          Retour à l’espace Pro
        </Link>
      </section>
    </main>
  );
}
