import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, ImagePlus, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OFFER_TYPE_LABELS } from "@/lib/labels";
import { useAppStore } from "@/lib/store";
import { correctOfferTitleOnline } from "@/lib/title-corrector";
import type { OfferType } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pro/new")({
  component: ProNew,
});

const TYPES: OfferType[] = ["FLASH", "PROMO", "ARRIVAGE", "DERNIERE_MINUTE"];

const DURATIONS = [30, 60, 120, 180, 360, 720, 1440] as const;

function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${hours} h`;
}

function compressOfferImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const maxSize = 1200;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas indisponible"));
        return;
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible"));
    };
    image.src = url;
  });
}

type ImprovementMode = "correct" | "professional" | "seller";

const IMPROVEMENT_MODES: Array<{ id: ImprovementMode; label: string }> = [
  { id: "correct", label: "Corriger" },
  { id: "professional", label: "Professionnel" },
  { id: "seller", label: "Vendeur" },
];

function cleanOfferTitle(value: string): string {
  let title = value
    .trim()
    .toLocaleLowerCase("fr-CH")
    .replace(/[-–—:;]+/g, " ")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");

  const corrections: Array<[RegExp, string]> = [
    [/\bje\s+vend(?:s)?\s+/g, ""],
    [/\bon\s+vend\s+/g, ""],
    [/\bje\s+propose\s+/g, ""],
    [/\bnous\s+proposons\s+/g, ""],
    [/\bvente\s+de\s+/g, ""],
    [/\b(?:super\s+)?promo(?:tion)?(?:\s+(?:sur|de|pour))?\s*/g, ""],
    [/\bpas\s+cher(?:e|es|s)?\b/g, "à prix doux"],
    [/\baujourdhui\b/g, "aujourd’hui"],
    [/\bpanier\s+(?:de\s+)?fruits?\b/g, "panier de fruits"],
    [/\bfruits?\s+du\s+jour\b/g, "fruits du jour"],
    [/\bdes\s+pomme\b/g, "des pommes"],
    [/\bpomme(?:s)?\s+fraiche(?:s)?\b/g, "pommes fraîches"],
    [/\bdes\s+legume\b/g, "des légumes"],
    [/\blegume(?:s)?\s+frais?\b/g, "légumes frais"],
    [/\bfrommage\b/g, "fromage"],
    [/\bvienoiserie(?:s)?\b/g, "viennoiseries"],
    [/\bpatisserie(?:s)?\b/g, "pâtisseries"],
    [/\bgateau(?:x)?\b/g, "gâteaux"],
    [/\bchocolat\s+artisanale\b/g, "chocolat artisanal"],
    [/\bproduit(?:s)?\s+local(?:e|es)?\b/g, "produits locaux"],
    [/\bfait\s+maison\b/g, "fait maison"],
    [/\barrivage\s+de\s+nouveau\b/g, "nouvel arrivage"],
    [/\bnouveau\s+arrivage\b/g, "nouvel arrivage"],
    [/\b1\s+can(?:e|n)?t(?:e|tes)?\b/g, "1 canette"],
    [/\b([2-9]|\d{2,})\s+can(?:e|n)?t(?:e|tes)?\b/g, "$1 canettes"],
    [/\bfonta\b/g, "Fanta"],
    [/\bfentha\b/g, "Fanta"],
    [/\bcanettes?\s+(?=Fanta\b)/g, "$&de "],
    [/\bune\s+des(?:s|z)?ert\b/g, "un dessert"],
    [/\bdes(?:s|z)?ert\b/g, "dessert"],
  ];

  for (const [pattern, replacement] of corrections) {
    title = title.replace(pattern, replacement);
  }

  title = title.replace(/[-–—:;]+/g, " ").replace(/\s+/g, " ").trim();
  return title ? title.charAt(0).toLocaleUpperCase("fr-CH") + title.slice(1) : "";
}

function improveOfferTitles(value: string, mode: ImprovementMode, type: OfferType): string[] {
  const clean = cleanOfferTitle(value);
  if (!clean) return [];

  const lower = clean.charAt(0).toLocaleLowerCase("fr-CH") + clean.slice(1);
  const hasFreshness = /\bfrais|fraîche|du jour|maison|artisanal|local/.test(lower);
  const withoutSalesWords = lower
    .replace(/offre spéciale\s*/g, "")
    .replace(/à prix doux\s*/g, "")
    .replace(/\bsuper\b\s*/g, "")
    .trim();
  const marketingCore = withoutSalesWords
    .replace(/^(?:des|les|un|une|du|de la|de l’)\s+/g, "")
    .trim();

  let candidates: string[];
  if (mode === "correct") {
    candidates = [clean];
  } else if (mode === "professional") {
    candidates = [
      clean,
      cleanOfferTitle(`${marketingCore} sélection du jour`),
      cleanOfferTitle(`${marketingCore} qualité et fraîcheur`),
    ];
  } else {
    const lead = type === "ARRIVAGE" ? "Nouvel arrivage" : type === "EXCLUSIVITE" ? "Exclusivité" : "Offre du jour";
    candidates = [
      cleanOfferTitle(`${lead} ${marketingCore}`),
      cleanOfferTitle(`${marketingCore} à prix doux`),
      cleanOfferTitle(`${marketingCore} ${hasFreshness ? "à découvrir aujourd’hui" : "sélection du jour"}`),
    ];
  }

  return [...new Set(candidates)]
    .map((candidate) => candidate.replace(/[-–—:;]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 3);
}

function ProNew() {
  const createOffer = useAppStore((s) => s.createOffer);
  const extraOffers = useAppStore((s) => s.extraOffers);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("6.90");
  const [original, setOriginal] = useState("10.50");
  const [stock, setStock] = useState("8");
  const [type, setType] = useState<OfferType>("PROMO");
  const [availabilityMode, setAvailabilityMode] = useState<"lots" | "duration">("lots");
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [image, setImage] = useState<string | undefined>();
  const [imageName, setImageName] = useState("");
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [improvementMode, setImprovementMode] = useState<ImprovementMode>("professional");
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [isCorrecting, setIsCorrecting] = useState(false);

  return (
    <form
      className="space-y-5 px-5 py-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const p = Number(price);
        const o = original ? Number(original) : undefined;
        const q = availabilityMode === "duration" ? 999 : Math.max(1, Math.round(Number(stock)));
        if (!title.trim() || !Number.isFinite(p) || p <= 0) {
          toast("Complétez le titre et le prix");
          return;
        }
        if ((type === "ARRIVAGE" || type === "DERNIERE_MINUTE") && extraOffers.filter((offer) => {
          if (offer.type !== type || !offer.createdAt) return false;
          const created = new Date(offer.createdAt);
          const now = new Date();
          return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
        }).length >= 2) {
          toast(`${OFFER_TYPE_LABELS[type]} est limitée à 2 utilisations par mois`);
          return;
        }
        const offer = await createOffer({
          title: title.trim(),
          image,
          price: p,
          originalPrice: o && o > p ? o : undefined,
          stock: q,
          type,
          unit: "lot",
          availabilityMode,
          durationMinutes: availabilityMode === "duration" ? durationMinutes : undefined,
        });
        if (!offer) {
          toast("Impossible de publier");
          return;
        }
        toast("Offre publiée");
        void navigate({ to: "/pro/offers" });
      }}
    >
      <div>
        <h1 className="font-display text-2xl font-bold">Nouvelle offre</h1>
        <p className="mt-1 text-sm text-mute">Moins d’une minute · visible tout de suite côté client.</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-mute">Photo de l’offre</p>
        {image ? (
          <div className="relative mt-2 overflow-hidden rounded-[var(--radius-lg)] bg-card shadow-[var(--shadow-card)]">
            <img src={image} alt="Aperçu de l’offre" className="h-48 w-full object-cover" />
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="min-w-0 truncate text-xs font-semibold text-mute">{imageName}</p>
              <button type="button" onClick={() => { setImage(undefined); setImageName(""); }} className="inline-flex items-center gap-1 text-xs font-bold text-deal">
                <Trash2 className="size-4" /> Retirer
              </button>
            </div>
          </div>
        ) : (
          <label className="mt-2 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-line bg-card px-4 text-center shadow-[var(--shadow-card)] press">
            {isImageLoading ? <Loader2 className="size-7 animate-spin text-mute" /> : <ImagePlus className="size-7" />}
            <span className="mt-2 text-sm font-bold">Ajouter une photo</span>
            <span className="mt-1 text-xs text-mute">Galerie ou appareil photo · JPG, PNG, WebP</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={isImageLoading}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                if (!file.type.startsWith("image/")) {
                  toast("Choisissez une image");
                  return;
                }
                if (file.size > 15 * 1024 * 1024) {
                  toast("La photo est trop lourde");
                  return;
                }
                setIsImageLoading(true);
                try {
                  setImage(await compressOfferImage(file));
                  setImageName(file.name);
                } catch {
                  toast("Impossible de lire cette photo");
                } finally {
                  setIsImageLoading(false);
                }
              }}
            />
          </label>
        )}
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-mute">Titre</span>
        <Input
          className="mt-1.5"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleSuggestions([]);
          }}
          placeholder="Panier fruits du jour"
        />
      </label>
      <div className="-mt-3 rounded-[var(--radius-lg)] bg-card p-3 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold">Assistant de rédaction</p>
            <p className="mt-0.5 text-[11px] leading-tight text-mute">Orthographe, grammaire et formulation commerciale.</p>
          </div>
          <Sparkles className="size-5 shrink-0 text-mute" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-paper p-1">
          {IMPROVEMENT_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                setImprovementMode(mode.id);
                setTitleSuggestions([]);
              }}
              className={cn(
                "h-8 rounded-full px-2 text-[11px] font-bold press",
                improvementMode === mode.id ? "bg-ink text-paper" : "text-mute",
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={isCorrecting}
          onClick={async () => {
            if (!title.trim()) {
              toast("Écrivez d’abord un titre");
              return;
            }
            setIsCorrecting(true);
            try {
              const result = await correctOfferTitleOnline({ data: { text: title } });
              if (improvementMode === "correct") {
                setTitle(result.corrected);
                setTitleSuggestions([]);
                toast("Titre corrigé en ligne");
              } else {
                const suggestions = improveOfferTitles(result.corrected, improvementMode, type);
                setTitleSuggestions(suggestions);
                toast("3 propositions générées après correction");
              }
            } catch {
              toast("Correcteur en ligne indisponible. Réessayez dans un instant.");
            } finally {
              setIsCorrecting(false);
            }
          }}
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-lime px-4 text-sm font-bold text-ink press disabled:opacity-60"
        >
          {isCorrecting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-3.5" />}
          {isCorrecting ? "Correction en cours" : improvementMode === "correct" ? "Corriger avec LanguageTool" : "Générer des propositions"}
        </button>
        {titleSuggestions.length > 1 && (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-mute">Choisir une proposition</p>
            {titleSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setTitle(suggestion);
                  setTitleSuggestions([]);
                  toast("Proposition appliquée");
                }}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-3 py-2.5 text-left text-sm font-semibold press"
              >
                <span>{suggestion}</span>
                <Check className="size-4 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-mute">Prix CHF</span>
          <Input className="mt-1.5" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-mute">Prix barré</span>
          <Input className="mt-1.5" inputMode="decimal" value={original} onChange={(e) => setOriginal(e.target.value)} />
        </label>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-mute">Type</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                if (t === "DERNIERE_MINUTE") setAvailabilityMode("duration");
              }}
              className={cn(
                "h-10 rounded-full px-3.5 text-sm font-medium press",
                type === t ? "bg-lime text-ink" : "bg-card shadow-[var(--shadow-card)]",
              )}
            >
              {OFFER_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-mute">Offre valable</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={type === "DERNIERE_MINUTE"}
            onClick={() => setAvailabilityMode("lots")}
            className={cn(
              "rounded-[var(--radius-md)] px-3 py-3 text-left press",
              availabilityMode === "lots" && type !== "DERNIERE_MINUTE" ? "bg-ink text-paper" : "bg-card text-mute shadow-[var(--shadow-card)]",
              type === "DERNIERE_MINUTE" && "opacity-50",
            )}
          >
            <span className="block text-sm font-bold">En lots</span>
            <span className="mt-0.5 block text-[11px]">Jusqu’à épuisement</span>
          </button>
          <button
            type="button"
            onClick={() => setAvailabilityMode("duration")}
            className={cn(
              "rounded-[var(--radius-md)] px-3 py-3 text-left press",
              availabilityMode === "duration" || type === "DERNIERE_MINUTE" ? "bg-ink text-paper" : "bg-card text-mute shadow-[var(--shadow-card)]",
            )}
          >
            <span className="block text-sm font-bold">En durée</span>
            <span className="mt-0.5 block text-[11px]">De 30 min à 24 h</span>
          </button>
        </div>

        {availabilityMode === "lots" && type !== "DERNIERE_MINUTE" ? (
          <label className="mt-3 block">
            <span className="text-xs font-semibold uppercase tracking-wide text-mute">Nombre de lots disponibles</span>
            <Input className="mt-1.5" inputMode="numeric" min="1" value={stock} onChange={(e) => setStock(e.target.value)} />
          </label>
        ) : (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-mute">Durée maximale</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DURATIONS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setDurationMinutes(minutes)}
                  className={cn(
                    "h-9 rounded-full px-3 text-xs font-bold press",
                    durationMinutes === minutes ? "bg-lime text-ink" : "bg-card shadow-[var(--shadow-card)]",
                  )}
                >
                  {durationLabel(minutes)}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === "FLASH" && (
          <p className="mt-2 text-xs text-mute">Cette offre disparaîtra automatiquement à la fermeture du commerce.</p>
        )}
        {type === "PROMO" && availabilityMode === "duration" && (
          <p className="mt-2 text-xs text-mute">Le compteur se met en pause à la fermeture et reprend à l’ouverture.</p>
        )}
        {type === "DERNIERE_MINUTE" && (
          <p className="mt-2 text-xs text-mute">Dernière chance fonctionne uniquement avec une durée et peut être utilisée 2 fois par mois.</p>
        )}
        {type === "ARRIVAGE" && (
          <p className="mt-2 text-xs text-mute">Nouveauté apparaît dans Nouveau aujourd’hui et peut être utilisée 2 fois par mois.</p>
        )}
      </div>

      <Button type="submit" size="lg">
        Publier l’offre
      </Button>
    </form>
  );
}
