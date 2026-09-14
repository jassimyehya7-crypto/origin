"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";

export function StaffLoginForm({
  role,
  title,
  subtitle,
  defaultNext,
}: {
  role: "pro" | "fondateur";
  title: string;
  subtitle: string;
  defaultNext: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || defaultNext;
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Code incorrect");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-ec-paper px-4">
      <div className="rounded-[24px] border border-ec-rule bg-ec-surface p-6 shadow-sm">
        <Logo size="sm" />
        <h1 className="mt-4 font-display text-2xl text-ec-ink">{title}</h1>
        <p className="mt-1 text-sm font-semibold text-ec-muted">{subtitle}</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-ec-muted">
              Code d&apos;accès
            </span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="h-12 w-full rounded-[12px] border border-ec-rule bg-white px-4 text-base font-bold text-ec-ink outline-none focus:border-ec-ink"
              placeholder="••••"
              required
            />
          </label>
          {error ? (
            <p className="text-sm font-bold text-ec-red">{error}</p>
          ) : null}
          <Button type="submit" full size="lg" disabled={loading || !pin}>
            {loading ? "Vérification…" : "Entrer"}
          </Button>
        </form>
      </div>
    </div>
  );
}
