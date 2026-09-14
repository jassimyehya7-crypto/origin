"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Heart, MapPin, PackageCheck, ShieldCheck } from "lucide-react";
import { QuantitySelector } from "@/components/QuantitySelector";
import { OfferTypeBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { LiveRefresh } from "@/hooks/useLiveRefresh";
import type { Offer, Shop } from "@/lib/types";
import {
  EC_PHONE_KEY,
  EC_PHONE_RISK_KEY,
  EC_PRENOM_KEY,
  EC_STRIKE_NOTE_KEY,
  ensureSoftUserId,
  resolveClientName,
  saveSoftProfile,
} from "@/lib/soft-profile";
import {
  fetchClientRisk,
  type ClientRiskStatus,
} from "@/lib/risk-status";
import { VisualMark } from "@/components/VisualMark";
import {
  discountPercent,
  formatCHF,
  formatTime,
  formatWalkDistance,
} from "@/lib/utils";

export function OfferDetailClient({
  offer,
  shop,
  initialFavorite,
  openReserve = false,
}: {
  offer: Offer;
  shop: Shop;
  initialFavorite: boolean;
  openReserve?: boolean;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");
  const [prenom, setPrenom] = useState("");
  const [phone, setPhone] = useState("");
  const [skipPhone, setSkipPhone] = useState(false);
  const [phoneRisk, setPhoneRisk] = useState(false);
  const [strikeNote, setStrikeNote] = useState("");
  const [banned, setBanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favorite, setFavorite] = useState(initialFavorite);
  const reserveRef = useRef<HTMLDivElement>(null);
  const disc = discountPercent(offer.price, offer.originalPrice);
  const max = Math.max(1, offer.quantityLeft);
  const available = offer.status === "PUBLIEE" && offer.quantityLeft > 0;
  const distance = formatWalkDistance(shop.lat, shop.lng);

  function applyRisk(s: ClientRiskStatus) {
    setPhoneRisk(s.risk);
    setBanned(s.banned);
    if (s.message) {
      setStrikeNote(s.message);
      localStorage.setItem(EC_STRIKE_NOTE_KEY, s.message);
    }
    if (s.risk) localStorage.setItem(EC_PHONE_RISK_KEY, "1");
    if (s.banned) {
      setError(s.message || "Réservations en pause.");
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    ensureSoftUserId();
    const savedPrenom = localStorage.getItem(EC_PRENOM_KEY) || "";
    const savedPhone = localStorage.getItem(EC_PHONE_KEY) || "";
    if (savedPrenom) setPrenom(savedPrenom);
    if (savedPhone) {
      setPhone(savedPhone);
      setSkipPhone(false);
    }
    if (localStorage.getItem(EC_PHONE_RISK_KEY) === "1") {
      setPhoneRisk(true);
    }
    const note = localStorage.getItem(EC_STRIKE_NOTE_KEY) || "";
    if (note) setStrikeNote(note);
  }, []);

  // Check risk by soft id (+ phone when present) — works without phone
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      try {
        const softUserId = ensureSoftUserId();
        const clientPhone = skipPhone ? "" : phone.trim();
        const s = await fetchClientRisk({
          softUserId,
          phone: clientPhone || null,
        });
        if (!cancelled) applyRisk(s);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phone, skipPhone]);

  useEffect(() => {
    if (!openReserve || !available) return;
    const el = reserveRef.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-ec-blue", "ring-offset-2");
      window.setTimeout(() => {
        el.classList.remove("ring-2", "ring-ec-blue", "ring-offset-2");
      }, 1200);
    }, 80);
    return () => window.clearTimeout(t);
  }, [openReserve, available]);

  async function toggleFav() {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId: shop.id }),
    });
    const data = await res.json();
    setFavorite(data.favorited);
  }

  async function reserve() {
    const name = prenom.trim();
    if (!name) {
      setError("Indique ton prénom (ou un pseudo) pour le magasin.");
      return;
    }
    if (banned) {
      setError(strikeNote || "Réservations en pause.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const scanSession =
        typeof window !== "undefined"
          ? localStorage.getItem("ec_scan_session") || undefined
          : undefined;
      const clientPhone = skipPhone ? "" : phone.trim();
      const softUserId = ensureSoftUserId();
      // Re-check ban before create (soft id / phone)
      const live = await fetchClientRisk({
        softUserId,
        phone: clientPhone || null,
      });
      if (live.banned) {
        applyRisk(live);
        setError(live.message || "Réservations en pause.");
        return;
      }
      saveSoftProfile(name, clientPhone);
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: offer.id,
          quantity: qty,
          message: message || undefined,
          clientName: resolveClientName(name),
          clientPhone,
          softUserId,
          scanSessionId: scanSession,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        if (data.error && String(data.error).toLowerCase().includes("pause")) {
          setBanned(true);
          setStrikeNote(data.error);
        }
        return;
      }
      if (data.phoneRisk && typeof window !== "undefined") {
        localStorage.setItem(EC_PHONE_RISK_KEY, "1");
      }
      if (data.strikeNote) {
        localStorage.setItem(EC_STRIKE_NOTE_KEY, data.strikeNote);
      }
      router.push(`/confirmation/${data.reservation.id}`);
    } catch {
      setError("Impossible d'envoyer la demande");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-ec-surface pb-28">
      <LiveRefresh types={["offers", "reservations"]} />
      <div className="relative flex h-56 items-center justify-center bg-ec-soft">
        <Link
          href="/"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-ec-rule bg-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={toggleFav}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-ec-rule bg-white"
          aria-label="Favori"
        >
          <Heart
            className={`h-5 w-5 ${favorite ? "fill-ec-red text-ec-red" : "text-ec-muted"}`}
          />
        </button>
        <VisualMark label={offer.title} stored={offer.emoji} size="hero" />
        <div className="absolute bottom-4 left-4">
          <OfferTypeBadge type={offer.type} />
        </div>
      </div>

      <div className="space-y-4 px-4 pt-5">
        <div className="space-y-2.5">
          <h1 className="font-display text-[2rem] leading-[1.05] text-ec-ink">
            {offer.title}
          </h1>
          <p className="text-sm font-bold text-ec-muted">
            <span className={disc !== null ? "text-ec-red" : "text-ec-ink"}>
              {disc !== null
                ? `-${disc}% · ${formatCHF(offer.price)}`
                : formatCHF(offer.price)}
            </span>
            {offer.originalPrice != null && (
              <span className="ml-2 font-semibold text-ec-muted line-through">
                {formatCHF(offer.originalPrice)}
              </span>
            )}
          </p>
          <p className="text-sm font-semibold text-ec-muted">
            {shop.name}
          </p>

          <p className="inline-flex items-center gap-1.5 text-sm font-bold text-ec-blue">
            <MapPin className="h-4 w-4" />
            {distance}
            <span className="font-semibold text-ec-muted">
              · {shop.address}, Villeneuve
            </span>
          </p>

          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-ec-muted">
            <Clock className="h-4 w-4 text-ec-green" />
            Jusqu&apos;à {formatTime(offer.validUntil)}
          </p>

          {available && (
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-ec-muted">
              <PackageCheck className="h-4 w-4 text-ec-green" />
              Encore {offer.quantityLeft}
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-2 font-extrabold text-ec-ink">À propos</h2>
          <p className="text-sm leading-relaxed text-ec-muted">
            {offer.description}
          </p>
        </div>

        <ul className="space-y-2 text-sm">
          {[
            "Produit frais / local",
            "Retrait en magasin — pas de livraison",
            "Réservation gratuite avec code",
          ].map((t) => (
            <li key={t} className="flex items-center gap-2 font-semibold text-ec-ink">
              <ShieldCheck className="h-4 w-4 text-ec-green" />
              {t}
            </li>
          ))}
        </ul>

        {strikeNote && (
          <div
            className={`rounded-[14px] border px-3 py-2 text-xs font-bold ${
              banned
                ? "border-ec-red/40 bg-ec-paper text-ec-red"
                : "border-ec-rule bg-ec-soft text-ec-ink"
            }`}
          >
            {strikeNote}
          </div>
        )}

        {available ? (
          <div
            ref={reserveRef}
            id="reserver"
            className="ec-corner-cut space-y-4 border border-ec-rule p-4 transition"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold">Quantité</span>
              <QuantitySelector value={qty} max={max} onChange={setQty} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-extrabold text-ec-ink">
                Prénom{" "}
                <span className="font-semibold text-ec-muted">(ou pseudo)</span>
              </label>
              <p className="mb-2 text-xs font-semibold text-ec-muted">
                Pour que le magasin sache qui vient
              </p>
              <input
                type="text"
                autoComplete="given-name"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Marie"
                className="w-full rounded-[12px] border border-ec-rule px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ec-blue"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-extrabold text-ec-ink">
                Téléphone{" "}
                <span className="font-semibold text-ec-muted">(optionnel)</span>
              </label>
              <p className="mb-2 text-xs font-semibold text-ec-muted">
                Pour que le commerce t&apos;appelle si besoin
              </p>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={skipPhone ? "" : phone}
                disabled={skipPhone || banned}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setSkipPhone(false);
                }}
                placeholder="079 000 00 00"
                className="w-full rounded-[12px] border border-ec-rule px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ec-blue disabled:bg-ec-soft disabled:text-ec-muted"
              />
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm font-semibold text-ec-muted">
                <input
                  type="checkbox"
                  checked={skipPhone}
                  disabled={banned}
                  onChange={(e) => setSkipPhone(e.target.checked)}
                  className="h-4 w-4 rounded border-ec-rule text-ec-blue"
                />
                Continuer sans numéro
              </label>
              {phoneRisk && !skipPhone && phone.trim() && !banned && (
                <p className="mt-2 rounded-[12px] bg-ec-soft px-3 py-2 text-xs font-bold text-ec-ink">
                  Vérification requise bientôt
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-ec-muted">
                Message (optionnel)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                disabled={banned}
                placeholder="Ex. Je passe vers 17h"
                className="w-full rounded-[12px] border border-ec-rule px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ec-blue disabled:bg-ec-soft"
              />
            </div>
            {error && <p className="text-sm font-bold text-ec-red">{error}</p>}
          </div>
        ) : (
          <div className="rounded-[20px] border border-ec-red/30 bg-ec-paper p-4 text-center text-sm font-extrabold text-ec-red">
            Cette offre n&apos;est plus disponible
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-ec-rule bg-ec-surface/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <Button
            full
            size="lg"
            variant="primary"
            disabled={!available || loading || banned}
            onClick={reserve}
          >
            {loading
              ? "Envoi…"
              : banned
                ? "Réservations en pause"
                : available
                  ? "Réserver"
                  : "Indisponible"}
          </Button>
          <p className="mt-2 text-center text-[11px] font-semibold text-ec-muted">
            Réservation gratuite · Pas de paiement en ligne · Retrait en magasin
          </p>
        </div>
      </div>
    </div>
  );
}
