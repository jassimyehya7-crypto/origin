"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Info,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LiveRefresh } from "@/hooks/useLiveRefresh";
import type { Offer, Shop } from "@/lib/types";
import {
  EC_PHONE_KEY,
  EC_PHONE_RISK_KEY,
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
import { Logo } from "@/components/Logo";
import { OfferTimeRemaining } from "@/components/OfferTimeRemaining";
import { offerPhoto } from "@/lib/offer-photos";
import { isValidSwissPhone } from "@/lib/phone";
import { isPrototypeOffer, PROTOTYPE_NOTICE } from "@/lib/prototype";
import {
  discountPercent,
  formatCHF,
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
  const [prenom, setPrenom] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneRisk, setPhoneRisk] = useState(false);
  const [strikeNote, setStrikeNote] = useState("");
  const [banned, setBanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favorite, setFavorite] = useState(initialFavorite);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [phoneInfoOpen, setPhoneInfoOpen] = useState(false);
  const [sheetDragStart, setSheetDragStart] = useState<number | null>(null);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const reserveRef = useRef<HTMLDivElement>(null);
  const photo = offerPhoto(offer);
  const disc = discountPercent(offer.price, offer.originalPrice);
  const available = offer.status === "PUBLIEE" && (offer.durationHours || offer.quantityLeft > 0) && new Date(offer.validUntil).getTime() > Date.now();
  const distance = formatWalkDistance(shop.lat, shop.lng);
  const left = offer.quantityLeft;
  const stockPercent = Math.max(
    8,
    Math.min(100, Math.round((left / Math.max(offer.quantityTotal, left, 1)) * 100)),
  );
  const prototype = isPrototypeOffer(offer);

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
    // Prénom : jamais prérempli (placeholder seulement)
    const savedPhone = localStorage.getItem(EC_PHONE_KEY) || "";
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
          message: undefined,
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
    <div className="mx-auto min-h-dvh max-w-lg bg-white pb-8 text-[#07132c]">
      <LiveRefresh types={["offers", "reservations"]} />
      <header className="flex h-[76px] items-center justify-between px-5">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-start"
          aria-label="Retour à l'accueil"
        >
          <ArrowLeft className="h-8 w-8" strokeWidth={2.4} />
        </Link>
        <Logo size="lg" className="absolute left-1/2 -translate-x-1/2" />
        <button
          type="button"
          onClick={toggleFav}
          className="flex h-11 w-11 items-center justify-end"
          aria-label="Favori"
        >
          <Heart
            className={`h-8 w-8 ${favorite ? "fill-ec-red text-ec-red" : "text-[#07132c]"}`}
            strokeWidth={2.2}
          />
        </button>
      </header>

      <main className="px-5">
        <h2 className="mb-4 text-center text-[28px] font-black leading-tight tracking-[-0.035em]">
          {shop.name}
        </h2>

        <div className="relative h-[250px] overflow-hidden rounded-[5px] bg-ec-soft sm:h-[300px]">
          {disc !== null && (
            <span className="absolute left-2 top-2 z-10 rounded-[4px] bg-[#ff2032] px-3 py-2 text-[25px] font-black text-white shadow-sm">
              -{disc}%
            </span>
          )}
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

      <div className="space-y-4 pt-3">
        {prototype && (
          <div className="ec-corner-cut border border-ec-rule bg-ec-soft px-3 py-2 text-xs font-extrabold text-ec-ink">
            {PROTOTYPE_NOTICE}
          </div>
        )}
        <section className="space-y-2">
          <h1 className="text-[25px] font-black leading-tight tracking-[-0.025em]">
            {offer.title}
          </h1>
          <div className="flex items-baseline gap-3">
            {offer.originalPrice != null && (
              <span className="text-[20px] font-bold text-[#9099ad] line-through">
                {formatCHF(offer.originalPrice)}
              </span>
            )}
            <span className="text-[27px] font-black text-[#ff2032]">
              {formatCHF(offer.price)}
            </span>
          </div>
          {available && (
            offer.durationHours ? (
              <div className="rounded-[4px] bg-[#ff2032] px-4 py-3 text-lg font-black text-white" aria-live="polite">
                ◷ <OfferTimeRemaining validUntil={offer.validUntil} />
              </div>
            ) : <div className="grid grid-cols-[148px_1fr] gap-2" aria-live="polite">
              <div className="flex min-h-[58px] items-center justify-center rounded-[4px] bg-[#ff2032] px-3 text-[25px] font-black text-white">
                {left} dispo
              </div>
              <div className="rounded-[4px] bg-[#fff0f2] p-2">
                <div className="h-3.5 overflow-hidden rounded-[3px] bg-[#f7cbd1]">
                  <div className="h-full rounded-[3px] bg-[#ff2032]" style={{ width: `${stockPercent}%` }} />
                </div>
                <p className="mt-1 text-[14px] font-bold">Plus que {left} disponible{left > 1 ? "s" : ""} !</p>
              </div>
            </div>
          )}
        </section>

        <a
          href={`https://maps.apple.com/?ll=${shop.lat},${shop.lng}&q=${encodeURIComponent(shop.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-[5px] border border-[#dde1e8] bg-white shadow-sm"
        >
          <iframe
            title={`Carte de ${shop.name}`}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${shop.lng - 0.025}%2C${shop.lat - 0.012}%2C${shop.lng + 0.025}%2C${shop.lat + 0.012}&layer=mapnik&marker=${shop.lat}%2C${shop.lng}`}
            className="pointer-events-none h-[112px] w-full border-0"
            loading="lazy"
          />
          <div className="flex items-center justify-between px-3 py-2.5">
            <div>
              <p className="text-[17px] font-black">À {shop.city || "Villeneuve"}</p>
              <p className="text-[14px] font-semibold text-[#7f899f]">{distance}</p>
            </div>
            <ArrowRight className="h-7 w-7" />
          </div>
        </a>

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
            className="space-y-4 rounded-[6px] border border-[#e2e5eb] bg-white p-3 shadow-[0_3px_16px_rgba(7,19,44,0.06)] transition"
          >
            <div>
              <h3 className="text-[23px] font-black tracking-[-0.025em]">Finaliser ma réservation</h3>
              <p className="text-[13px] font-medium text-[#8993a8]">
                Votre réservation est gratuite et sans engagement. Vous recevez une confirmation par SMS.
              </p>
            </div>

            <div className="grid grid-cols-[88px_1fr] items-center gap-3">
              <label className="text-[15px] font-black">Prénom</label>
              <input
                type="text"
                autoComplete="given-name"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Votre prénom"
                className="h-12 w-full rounded-[5px] border border-[#d7dce5] px-3 text-[15px] font-semibold outline-none placeholder:text-[#a2aabc] focus:border-[#07132c]"
              />
            </div>

            <div className="grid grid-cols-[88px_1fr] items-center gap-3">
              <label className="text-[15px] font-black">Téléphone</label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                disabled={banned}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+41 7X XXX XX XX"
                required
                className="h-12 w-full rounded-[5px] border border-[#d7dce5] px-3 text-[15px] font-semibold outline-none placeholder:text-[#a2aabc] focus:border-[#07132c] disabled:bg-ec-soft"
              />
            </div>

            <button
              type="button"
              onClick={() => setPhoneInfoOpen(true)}
              className="flex w-full items-center gap-2 text-left text-[13px] font-semibold text-[#8993a8] active:opacity-70"
              aria-haspopup="dialog"
            >
              <Info className="h-5 w-5 shrink-0 text-[#07132c]" />
              <span className="flex-1">Pourquoi demandons-nous votre numéro ?</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#07132c]" />
            </button>

            {phoneRisk && phone.trim() && !banned && (
              <p className="rounded-[5px] bg-ec-soft px-3 py-2 text-xs font-bold">Vérification requise bientôt</p>
            )}
            {error && <p className="text-sm font-bold text-ec-red">{error}</p>}

            <Button
              full
              size="lg"
              variant="confirm"
              className="min-h-[58px] rounded-[4px] text-[16px] font-black"
              disabled={!available || loading || banned}
              onClick={reserve}
            >
              {loading ? "Envoi…" : banned ? "Réservations en pause" : `Réserver et recevoir ma confirmation`}
              {!loading && !banned && <ArrowRight className="ml-2 h-6 w-6" />}
            </Button>

            <p className="text-center text-[11px] font-semibold text-[#8993a8]">
              1 lot · 1 réservation par personne
            </p>
          </div>
        ) : (
          <div className="ec-corner-cut border border-ec-red/30 bg-ec-paper p-4 text-center text-sm font-extrabold text-ec-red">
            Cette offre n&apos;est plus disponible
          </div>
        )}
      </div>
      </main>

      {phoneInfoOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55"
          role="dialog"
          aria-modal="true"
          aria-labelledby="phone-info-title"
        >
          <section
            className="relative max-h-[82dvh] w-full max-w-lg overflow-y-auto rounded-t-[22px] bg-white px-6 pb-7 pt-12 shadow-2xl transition-transform duration-200 ease-out"
            style={{
              transform: `translateY(${sheetDragOffset}px)`,
              transitionDuration: sheetDragStart === null ? "200ms" : "0ms",
            }}
          >
            <div
              className="absolute inset-x-0 top-0 flex h-11 touch-none cursor-grab items-center justify-center active:cursor-grabbing"
              role="button"
              tabIndex={0}
              aria-label="Faire glisser vers le bas pour fermer"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setSheetDragStart(event.clientY);
              }}
              onPointerMove={(event) => {
                if (sheetDragStart === null) return;
                setSheetDragOffset(Math.max(0, event.clientY - sheetDragStart));
              }}
              onPointerUp={(event) => {
                event.currentTarget.releasePointerCapture(event.pointerId);
                const finalOffset =
                  sheetDragStart === null
                    ? sheetDragOffset
                    : Math.max(0, event.clientY - sheetDragStart);
                if (finalOffset > 90) {
                  setSheetDragOffset(window.innerHeight);
                  window.setTimeout(() => {
                    setPhoneInfoOpen(false);
                    setSheetDragOffset(0);
                  }, 180);
                } else {
                  setSheetDragOffset(0);
                }
                setSheetDragStart(null);
              }}
              onPointerCancel={() => {
                setSheetDragStart(null);
                setSheetDragOffset(0);
              }}
            >
              <span className="h-1.5 w-16 rounded-full bg-[#a8adb7]" />
            </div>

            <h2 id="phone-info-title" className="text-[24px] font-black leading-tight tracking-[-0.025em]">
              Pourquoi demandons-nous votre numéro ?
            </h2>
            <p className="mt-2 text-[15px] font-medium leading-snug text-[#7f899f]">
              Votre numéro de téléphone est uniquement utilisé dans le cadre des réservations sur OffresLocal. Il nous permet de :
            </p>

            <div className="mt-5 space-y-4">
              {[
                [MessageCircle, "Confirmer votre réservation", "Vous recevez un SMS de confirmation avec les détails de votre réservation."],
                [Phone, "Permettre au commerçant de vous contacter", "Le commerçant peut vous joindre si nécessaire au sujet du retrait de votre produit."],
                [ShieldCheck, "Garantir un service fiable et équitable", "Nous vérifions qu’il s’agit d’un numéro réel afin de limiter les abus et de garantir l’accès au plus grand nombre."],
              ].map(([Icon, title, description]) => {
                const RowIcon = Icon as typeof MessageCircle;
                return (
                  <div key={String(title)} className="grid grid-cols-[52px_1fr] items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f4f6]">
                      <RowIcon className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="text-[15px] font-black leading-tight">{String(title)}</h3>
                      <p className="mt-0.5 text-[13px] font-medium leading-snug text-[#7f899f]">{String(description)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="my-5 h-px bg-[#dfe2e8]" />

            <h3 className="text-[20px] font-black leading-tight">Que se passe-t-il en cas de réservation non retirée ?</h3>
            <p className="mt-1 text-[13px] font-medium leading-snug text-[#7f899f]">
              Pour assurer un bon fonctionnement du service et par respect pour les commerçants, un système de suivi est mis en place :
            </p>

            <ol className="relative mt-4 space-y-4 rounded-[10px] bg-[#f6f7f9] px-4 py-4 before:absolute before:bottom-7 before:left-[29px] before:top-7 before:w-px before:bg-[#cbd0da]">
              {[
                ["1er retrait manqué sans annulation", "Un avertissement est enregistré sur votre numéro."],
                ["2e retrait manqué sans annulation", "Un SMS d’avertissement est envoyé sur votre numéro."],
                ["3e retrait manqué sans annulation", "Vos réservations sont suspendues pendant 7 jours."],
                ["Après réactivation, 3 nouveaux retraits manqués", "Vos réservations sont suspendues pendant 30 jours."],
                ["Après une nouvelle réactivation, 3 nouveaux retraits manqués", "Votre numéro est définitivement suspendu. Vous pouvez nous écrire pour demander une réactivation."],
              ].map(([title, description], index) => (
                <li key={title} className="relative grid grid-cols-[36px_1fr] gap-3">
                  <span className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#b9bfcb] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[13px] font-black leading-tight">{title}</p>
                    <p className="mt-0.5 text-[12px] font-medium leading-snug text-[#7f899f]">{description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-4 flex gap-3 rounded-[10px] bg-[#f5fbcf] p-4">
              <Info className="h-7 w-7 shrink-0" />
              <div>
                <p className="text-sm font-black">Bon à savoir</p>
                <p className="mt-0.5 text-[12px] font-medium leading-snug">
                  Une réservation annulée avant l’échéance ne compte pas comme un retrait manqué.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
