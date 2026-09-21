import { useState, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { BackCircle, PageShell } from "@/components/back-header";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { getMerchant } from "@/lib/data/catalog";
import { chf } from "@/lib/format";
import { useAppStore, useLiveOffer, useStock } from "@/lib/store";

export const Route = createFileRoute("/reserve/$offerId")({
  component: Reserve,
});

function Reserve() {
  const { offerId } = Route.useParams();
  const navigate = useNavigate();
  const offer = useLiveOffer(offerId);
  const merchant = offer ? getMerchant(offer.merchantId) : undefined;
  const stock = useStock(offerId, offer?.stock ?? 0);
  const reserve = useAppStore((s) => s.reserve);
  const [qty, setQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);

  if (!offer || !merchant) {
    return (
      <PageShell>
        <div className="p-6">
          <BackCircle />
          <p className="mt-8 text-sm text-mute">Offre introuvable.</p>
        </div>
      </PageShell>
    );
  }

  const safeQty = Math.min(qty, Math.max(1, stock));

  return (
    <PageShell>
      <header className="flex items-center gap-3 px-5 pb-3 pt-5 safe-top">
        <BackCircle />
        <h1 className="font-display text-lg font-semibold">Réserver</h1>
      </header>
      <div className="px-5 pb-10">
        <div className="flex gap-3 rounded-[var(--radius-lg)] bg-card p-3 shadow-[var(--shadow-card)]">
          <Photo src={offer.image} alt={offer.title} className="size-20 rounded-[var(--radius-sm)]" />
          <div>
            <p className="text-xs text-mute">{merchant.name}</p>
            <h2 className="font-display text-lg font-semibold">{offer.title}</h2>
            <p className="font-bold tabular text-deal">{chf(offer.price)}</p>
          </div>
        </div>

        {stock > 1 ? (
          <div className="mt-8">
            <p className="text-sm font-semibold">Quantité</p>
            <div className="mt-3 flex items-center gap-4">
              <button
                type="button"
                aria-label="Diminuer"
                disabled={safeQty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid size-12 place-items-center rounded-full bg-soft press disabled:opacity-40"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center font-display text-2xl font-bold tabular">{safeQty}</span>
              <button
                type="button"
                aria-label="Augmenter"
                disabled={safeQty >= stock}
                onClick={() => setQty((q) => Math.min(stock, q + 1))}
                className="grid size-12 place-items-center rounded-full bg-soft press disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-8 rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-mute">Vous réservez</p>
          <p className="mt-2 font-display text-lg font-semibold">
            {safeQty} × {offer.title}
          </p>
          <p className="mt-1 text-xl font-bold tabular">{chf(offer.price * safeQty)}</p>
          <p className="mt-3 text-sm text-mute">À retirer avant {offer.until} · {offer.unit}</p>
        </div>

        <Button
          size="lg"
          className="mt-8"
          disabled={stock < 1 || isSubmitting}
          onClick={() => {
            // Protection anti-double-clic
            if (submitLock.current) return;
            submitLock.current = true;
            setIsSubmitting(true);

            const res = reserve(offer.id, safeQty);
            if (!res) {
              toast("Stock insuffisant");
              submitLock.current = false;
              setIsSubmitting(false);
              return;
            }
            void navigate({
              to: "/confirmation/$reservationId",
              params: { reservationId: res.id },
            });
          }}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Envoi en cours…
            </span>
          ) : (
            "Envoyer la demande"
          )}
        </Button>
        <p className="mt-3 text-center text-xs text-mute">
          Aucun paiement en ligne · Code de retrait EC · Annulation simple
        </p>
      </div>
    </PageShell>
  );
}
