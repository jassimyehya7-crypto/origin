"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OfferCard } from "@/components/OfferCard";
import { Logo } from "@/components/Logo";
import type { Offer, Shop } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/labels";

export function QrClient({
  shop,
  offers,
}: {
  shop: Shop;
  offers: Offer[];
}) {
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    const key = "ec_scan_session";
    let sid = localStorage.getItem(key);
    if (!sid) {
      sid = `scan_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, sid);
    }
    fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopSlug: shop.slug,
        sessionId: sid,
        browsed: true,
      }),
    })
      .then(() => setRecorded(true))
      .catch(() => setRecorded(true));
  }, [shop.slug]);

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-ec-paper">
      <header className="bg-ec-ink px-4 pb-8 pt-6 text-white">
        <Logo inverted size="sm" />
        <div className="mt-6 flex items-center gap-3">
          <div className="text-5xl">{shop.emoji}</div>
          <div>
            <h1 className="font-display text-2xl">{shop.name}</h1>
            <p className="text-sm font-semibold text-white/70">
              {CATEGORY_LABELS[shop.category]} · {shop.address}, Villeneuve
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold text-white/80">
          Offres du jour — réservez, retirez ici.
        </p>
        {recorded && (
          <p className="mt-2 text-xs font-bold text-ec-yellow">
            ✓ Scan enregistré
          </p>
        )}
      </header>

      <main className="space-y-4 px-4 py-5">
        {offers.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-ec-rule bg-ec-surface p-8 text-center">
            <div className="text-4xl">📭</div>
            <p className="mt-2 font-extrabold text-ec-ink">
              Pas d&apos;offre publiée pour l&apos;instant
            </p>
            <p className="mt-1 text-sm font-semibold text-ec-muted">
              Revenez plus tard, ou voyez tout Villeneuve.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-extrabold text-ec-blue"
            >
              Voir tout Villeneuve
            </Link>
          </div>
        ) : (
          offers.map((o) => <OfferCard key={o.id} offer={o} shop={shop} />)
        )}
        <Link
          href="/"
          className="block text-center text-sm font-extrabold text-ec-blue"
        >
          Toutes les offres Villeneuve
        </Link>
      </main>
    </div>
  );
}
