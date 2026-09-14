"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Heart, MapPin, ShieldCheck } from "lucide-react";
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
import Image from "next/image";
import { VisualMark } from "@/components/VisualMark";
import { offerPhoto } from "@/lib/offer-photos";
import { isValidSwissPhone } from "@/lib/phone";
import {
  discountPercent,
  formatCHF,
  formatTime,
  formatWalkDistance,
} from "@/lib/utils";

function stockTone(n: number): {
  number: string;
  label: string;
  box: string;
} {
  if (n <= 1) {
    return {
      number: "text-ec-red",
      label: "text-ec-red",
      box: "border-ec-red/40 bg-ec-paper",
    };
  }
  if (n <= 2) {
    return {
      number: "text-ec-ink",
      label: "text-ec-ink",
      box: "border-ec-ink/15 bg-ec-yellow",
    };
  }
  if (n <= 4) {
    return {
      number: "text-[#C4890A]",
      label: "text-[#C4890A]",
      box: "border-[#C4890A]/30 bg-[#FFF8E8]",
    };
  }
  return {
    number: "text-ec-green",
    label: "text-ec-green",
    box: "border-ec-green/30 bg-[#E8F8F0]",
  };
}

function stockLabel(n: number): string {
  if (n === 1) return "Dernière";
  return "Encore";
}

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
  const [message, setMessage] = useState("");
  const [prenom, setPrenom] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneRisk, setPhoneRisk] = useState(false);
  const [strikeNote, setStrikeNote] = useState("");
  const [banned, setBanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favorite, setFavorite] = useState(initialFavorite);
  const [photoOpen, setPhotoOpen] = useState(false);
  const reserveRef = useRef<HTMLDivElement>(null);
  const photo = offerPhoto(offer.title);
  const disc = discountPercent(offer.price, offer.originalPrice);
  const available = offer.status === "PUBLIEE" && offer.quantityLeft > 0;
  const distance = formatWalkDistance(shop.lat, shop.lng);
  const left = offer.quantityLeft;
  const tone = stockTone(left);

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
    if (savedPhone) setPhone(savedPhone);
    if (localStorage.getItem(EC_PHONE_RISK_KEY) === "1") {
      setPhoneRisk(true);
    }
    const note = localStorage.getItem(EC_STRIKE_NOTE_KEY) || "";
    if (note) setStrikeNote(note);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      try {
        const softUserId = ensureSoftUserId();
        const clientPhone = phone.trim();
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
  }, [phone]);

  // Toujours arriver en haut (photo visible)
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo(0, 0);
  }, [offer.id, openReserve]);

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
    if (!name || name.length < 3) {
      setError("Le prénom doit contenir au moins 3 caractères.");
      return;
    }
    const clientPhone = phone.trim();
    if (!clientPhone) {
      setError("Indique ton numéro de téléphone.");
      return;
    }
    if (!isValidSwissPhone(clientPhone)) {
      setError("Indique un numéro suisse valide (ex. 079 000 00 00).");
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
      const softUserId = ensureSoftUserId();
      const live = await fetchClientRisk({
        softUserId,
        phone: clientPhone,
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
          quantity: 1,
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
      <div className="relative flex h-64 items-center justify-center overflow-hidden bg-ec-soft">
        <Link
          href="/"
          className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-ec-rule bg-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={toggleFav}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-ec-rule bg-white"
          aria-label="Favori"
        >
          <Heart
            className={`h-5 w-5 ${favorite ? "fill-ec-red text-ec-red" : "text-ec-muted"}`}
          />
        </button>
        {photo ? (
          <button
            type="button"
            onClick={() => setPhotoOpen(true)}
            className="absolute inset-0 block"
            aria-label="Voir la photo en grand"
          >
            <Image
              src={photo}
              alt={offer.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 512px) 100vw, 512px"
            />
          </button>
        ) : (
          <VisualMark label={offer.title} stored={offer.emoji} size="hero" />
        )}
      </div>

      {photoOpen && photo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ec-ink/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo de l'offre"
          onClick={() => setPhotoOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white px-3 py-1.5 text-sm font-extrabold text-ec-ink"
            onClick={() => setPhotoOpen(false)}
          >
            Fermer
          </button>
          <div
            className="relative h-[70vh] w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photo}
              alt={offer.title}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}

      <div className="space-y-5 px-4 pt-5">
        <div className="space-y-3">
          <h1 className="font-display text-[2rem] leading-[1.05] text-ec-ink">
            {offer.title}
          </h1>

          {/* Deal — % rouge bold, pas pastille pleine */}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {disc !== null ? (
              <>
                <span className="font-display text-[2.5rem] leading-none text-ec-red">
                  −{disc}%
                </span>
                <span className="font-display text-[1.75rem] leading-none text-ec-ink">
                  {formatCHF(offer.price)}
                </span>
                {offer.originalPrice != null && (
                  <span className="text-base font-semibold text-ec-muted line-through">
                    {formatCHF(offer.originalPrice)}
                  </span>
                )}
              </>
            ) : (
              <span className="font-display text-[1.75rem] leading-none text-ec-ink">
                {formatCHF(offer.price)}
              </span>
            )}
          </div>

          <p className="text-sm font-semibold text-ec-muted">{shop.name}</p>

          {/* Stock live — typo LARGE, vert→ambre→rouge ; jaune si ≤2 */}
          {available && (
            <div
              className={`ec-corner-cut flex items-end gap-3 border px-4 py-3 ${tone.box}`}
              aria-live="polite"
            >
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-display text-[3.25rem] leading-none tracking-tight ${tone.number}`}
                >
                  {left}
                </span>
                <div className="pb-1">
                  <p
                    className={`text-[11px] font-extrabold uppercase tracking-[0.08em] ${tone.label}`}
                  >
                    {stockLabel(left)}
                  </p>
                  <p className={`text-sm font-bold ${tone.label}`}>
                    {left === 1 ? "place" : "lots restants"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Meta muted sous le wow */}
          <div className="space-y-1.5 pt-0.5">
            <p className="inline-flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ec-muted">
              <MapPin className="h-4 w-4 shrink-0 text-ec-blue" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${shop.lat}%2C${shop.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-ec-blue underline-offset-2 hover:underline"
                aria-label={`Ouvrir ${shop.name} dans Plans / Maps`}
              >
                {distance}
              </a>
              <span>· {shop.address}, Villeneuve</span>
            </p>
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-ec-muted">
              <Clock className="h-4 w-4 text-ec-green" />
              Jusqu&apos;à {formatTime(offer.validUntil)}
            </p>
          </div>
        </div>

        <ul className="space-y-2 text-sm">
          {[
            "Frais / local",
            "Retrait en magasin",
            "Réservation gratuite · code",
          ].map((t) => (
            <li
              key={t}
              className="flex items-center gap-2 font-semibold text-ec-ink"
            >
              <ShieldCheck className="h-4 w-4 shrink-0 text-ec-green" />
              {t}
            </li>
          ))}
        </ul>

        {strikeNote && (
          <div
            className={`ec-corner-cut border px-3 py-2 text-xs font-bold ${
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
            <p className="text-[13px] font-medium tracking-wide text-ec-muted/80">
              1 lot · 1 réservation par personne
            </p>

            <div>
              <label className="mb-1 block text-sm font-extrabold text-ec-ink">
                Prénom
              </label>
              <p className="mb-2 text-xs font-semibold text-ec-muted">
                Pour le magasin au retrait
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
                Téléphone
              </label>
              <p className="mb-2 text-xs font-semibold text-ec-muted">
                Pour t&apos;envoyer le code et que le commerce t&apos;appelle si
                besoin
              </p>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                disabled={banned}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="079 000 00 00"
                required
                className="w-full rounded-[12px] border border-ec-rule px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ec-blue disabled:bg-ec-soft disabled:text-ec-muted"
              />
              {phoneRisk && phone.trim() && !banned && (
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
          <div className="ec-corner-cut border border-ec-red/30 bg-ec-paper p-4 text-center text-sm font-extrabold text-ec-red">
            Cette offre n&apos;est plus disponible
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-ec-rule bg-ec-surface/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <Button
            full
            size="lg"
            variant="confirm"
            className="rounded-none"
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
