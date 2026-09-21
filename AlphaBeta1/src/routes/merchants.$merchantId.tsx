import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Heart, MapPin, Moon, Navigation, Phone } from "lucide-react";
import { toast } from "sonner";
import { BackCircle, PageShell } from "@/components/back-header";
import { CountdownTimer } from "@/components/countdown-timer";
import { GoogleRating } from "@/components/google-rating";
import { FeedCard } from "@/components/offer-cards";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { getMerchant, liveOffersForMerchant } from "@/lib/data/catalog";
import { distLabel } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/labels";
import { extraMeters, isMerchantOpen } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/merchants/$merchantId")({
  component: MerchantPage,
});

function hourRows(hours: string) {
  return hours.split(" · ").map((part) => {
    const closed = part.match(/^(.*?)\s+(fermé)$/i);
    if (closed) return { days: closed[1], time: closed[2] };
    const timed = part.match(/^(.*?)\s+(\d{2}:\d{2}–\d{2}:\d{2})$/);
    if (timed) return { days: timed[1], time: timed[2] };
    return { days: part, time: "" };
  });
}

function MerchantPage() {
  const { merchantId } = Route.useParams();
  const merchant = getMerchant(merchantId);
  const locationId = useAppStore((s) => s.locationId);
  const followed = useAppStore((s) => s.followedMerchantIds.includes(merchantId));
  const toggle = useAppStore((s) => s.toggleFollowMerchant);
  const extraOffers = useAppStore((s) => s.extraOffers);
  const hiddenOfferIds = useAppStore((s) => s.hiddenOfferIds);
  const [tab, setTab] = useState<"offers" | "about">("offers");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!merchant) {
    return (
      <PageShell>
        <div className="p-6">
          <BackCircle />
          <p className="mt-8 text-sm text-mute">Commerce introuvable.</p>
        </div>
      </PageShell>
    );
  }

  const distance = merchant.distanceM + extraMeters(locationId);
  const allOffers = liveOffersForMerchant(merchant.id, extraOffers, hiddenOfferIds);
  const isOpen = mounted ? isMerchantOpen(merchant, new Date()) : false;

  // Filtrer les offres selon le statut du commerce
  const offers = allOffers.filter((o) => {
    // Si commerce ouvert → afficher toutes les offres
    if (isOpen) return true;
    // Si commerce fermé :
    // - Flash : disparaissent (expirent complètement)
    if (o.flags.includes("flash")) return false;
    // - Promo/hot/new : restent mais affichent "(à venir)"
    return true;
  });

  const maps = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(merchant.address)}`;
  const tel = `tel:${merchant.phone.replace(/\s/g, "")}`;
  const category =
    merchant.category === "all" ? "Commerce" : CATEGORY_LABELS[merchant.category];

  return (
    <PageShell>
      <div className="relative">
        <Photo
          src={merchant.banner}
          alt={`Devanture de ${merchant.name}`}
          className="h-64 w-full"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/45 via-ink/5 to-transparent" />
        <div className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))]">
          <BackCircle />
        </div>
        <p className="absolute bottom-6 left-5 z-10 rounded-full bg-lime px-3 py-1 text-xs font-semibold text-ink shadow-[var(--shadow-card)]">
          {category}
        </p>
      </div>

      <div className="relative -mt-5 rounded-t-[var(--radius-xl)] bg-paper px-5 pb-12 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-tight">{merchant.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <GoogleRating
                rating={merchant.rating}
                count={merchant.reviewCount}
                website={merchant.website || undefined}
              />
              <span className="text-sm text-mute">· {distLabel(distance)}</span>
            </div>
          </div>
          <Button
            variant={followed ? "outline" : "lime"}
            size="pill"
            onClick={() => {
              toggle(merchant.id);
              toast(followed ? "Commerce retiré" : "Vous suivez ce commerce");
            }}
          >
            <Heart className={cn("size-4", followed && "fill-deal text-deal")} />
            {followed ? "Suivi" : "Suivre"}
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] bg-card px-2 py-3 shadow-[var(--shadow-card)]">
            <span className="grid size-8 place-items-center rounded-full bg-soft">
              <MapPin className="size-3.5" />
            </span>
            <span className="px-0.5 text-center text-[11px] font-semibold leading-snug">
              {merchant.address.split(",")[0] ?? merchant.address}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] bg-card px-2 py-3 shadow-[var(--shadow-card)]">
            <span className="grid size-8 place-items-center rounded-full bg-soft">
              <Clock className="size-3.5" />
            </span>
            <span className="px-1 text-center text-[11px] font-semibold leading-snug">
              {merchant.hoursToday}
            </span>
          </div>
          <a
            href={maps}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] bg-card px-2 py-3 shadow-[var(--shadow-card)] press"
          >
            <span className="grid size-8 place-items-center rounded-full bg-ink text-paper">
              <Navigation className="size-3.5" />
            </span>
            <span className="text-[11px] font-semibold">Itinéraire</span>
          </a>
        </div>

        <div className="mt-6 flex gap-2">
          {(
            [
              ["offers", "Offres"],
              ["about", "À propos"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "h-10 flex-1 rounded-full text-sm font-semibold press",
                tab === id ? "bg-lime text-ink" : "bg-card shadow-[var(--shadow-card)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "offers" ? (
          <>
            {/* Bandeau fermé */}
            {mounted && !isOpen && (
              <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-lg)] bg-ink/5 px-4 py-3">
                <Moon className="size-5 text-mute" />
                <div>
                  <p className="text-sm font-semibold">Fermé</p>
                  <p className="text-xs text-mute">
                    Nous ouvrirons à {merchant.openFrom}
                  </p>
                </div>
              </div>
            )}
            {offers.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {offers.map((o) => {
                  // Si commerce fermé → afficher "(à venir)" avec countdown
                  if (!isOpen) {
                    return (
                      <div key={o.id} className="relative opacity-60">
                        <FeedCard offer={o} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-black/30">
                          <span className="text-sm font-bold italic text-white drop-shadow-lg">
                            À venir
                          </span>
                          <CountdownTimer offer={o} merchantId={o.merchantId} />
                        </div>
                      </div>
                    );
                  }
                  return <FeedCard key={o.id} offer={o} />;
                })}
              </div>
            ) : (
              <p className="mt-8 text-center text-sm text-mute">
                {mounted && !isOpen ? "Les offres reprendront à l'ouverture." : "Aucune offre en ce moment."}
              </p>
            )}
          </>
        ) : (
          <AboutPanel
            phone={merchant.phone}
            tel={tel}
            hours={merchant.hours}
            hoursToday={merchant.hoursToday}
            category={category}
            sells={merchant.sells}
            registryNumber={merchant.registryNumber}
          />
        )}
      </div>
    </PageShell>
  );
}

function AboutPanel({
  phone,
  tel,
  hours,
  hoursToday,
  category,
  sells,
  registryNumber,
}: {
  phone: string;
  tel: string;
  hours: string;
  hoursToday: string;
  category: string;
  sells: string[];
  registryNumber: string;
}) {
  const rows = hourRows(hours);

  return (
    <div className="mt-5 space-y-3">
      <a
        href={tel}
        className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-card)] press"
      >
        <span className="grid size-11 place-items-center rounded-full bg-lime">
          <Phone className="size-4.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-faint">
            Téléphone
          </span>
          <span className="mt-0.5 block font-display text-lg font-semibold tabular tracking-tight">
            {phone}
          </span>
        </span>
      </a>

      <section className="rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">Horaires</p>
          <p className="rounded-full bg-ok/10 px-2.5 py-0.5 text-[11px] font-semibold text-ok">
            {hoursToday}
          </p>
        </div>
        <ul className="mt-3 divide-y divide-line/80">
          {rows.map((row) => (
            <li key={row.days} className="flex items-baseline justify-between gap-4 py-2 text-sm">
              <span className="font-medium">{row.days}</span>
              <span
                className={cn(
                  "tabular",
                  /fermé/i.test(row.time) ? "text-mute" : "font-semibold",
                )}
              >
                {row.time}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-card)]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">Ils vendent</p>
        <p className="mt-1 font-display text-lg font-semibold">{category}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {sells.map((item) => (
            <span
              key={item}
              className="rounded-full bg-soft px-3 py-1.5 text-xs font-semibold text-ink"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-card)]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
          Registre du commerce
        </p>
        <p
          className={cn(
            "mt-2 rounded-[var(--radius-sm)] bg-soft px-3 py-2.5 font-mono text-sm tracking-wide",
            registryNumber ? "text-ink" : "text-faint",
          )}
        >
          {registryNumber || "—"}
        </p>
      </section>
    </div>
  );
}
