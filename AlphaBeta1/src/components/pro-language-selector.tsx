import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Globe2, Search } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "offreslocal-pro-language";

type Language = { code: string; name: string };
type GoogleTranslateWindow = Window & {
  google?: {
    translate?: {
      TranslateElement: new (options: Record<string, unknown>, elementId: string) => void;
    };
  };
  googleTranslateElementInit?: () => void;
};

function setTranslationCookie(code: string) {
  const maxAge = 60 * 60 * 24 * 365;
  if (code === "fr") {
    document.cookie = "googtrans=;path=/;max-age=0;SameSite=Lax";
    return;
  }
  document.cookie = `googtrans=/fr/${code};path=/;max-age=${maxAge};SameSite=Lax`;
}

function readGoogleLanguages(): Language[] {
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!select) return [];
  return Array.from(select.options)
    .filter((option) => option.value)
    .map((option) => ({ code: option.value, name: option.textContent?.trim() || option.value.toUpperCase() }));
}

export function ProLanguageSelector() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState("fr");
  const [languages, setLanguages] = useState<Language[]>([{ code: "fr", name: "Français" }]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || "fr";
    setCurrent(saved);
    setTranslationCookie(saved);
    document.documentElement.lang = saved;

    const translateWindow = window as GoogleTranslateWindow;
    const collectLanguages = () => {
      const loaded = readGoogleLanguages();
      if (loaded.length) {
        setLanguages([{ code: "fr", name: "Français" }, ...loaded.filter((language) => language.code !== "fr")]);
        const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
        if (select && saved !== "fr" && select.value !== saved) {
          select.value = saved;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    };

    translateWindow.googleTranslateElementInit = () => {
      const TranslateElement = translateWindow.google?.translate?.TranslateElement;
      if (!TranslateElement) return;
      new TranslateElement({ pageLanguage: "fr", autoDisplay: false }, "google_translate_element");
      window.setTimeout(collectLanguages, 350);
    };

    if (translateWindow.google?.translate?.TranslateElement) {
      translateWindow.googleTranslateElementInit();
    } else if (!document.querySelector("script[data-offreslocal-translate]")) {
      const script = document.createElement("script");
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.dataset.offreslocalTranslate = "true";
      document.head.appendChild(script);
    }
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return languages;
    return languages.filter((language) => `${language.name} ${language.code}`.toLocaleLowerCase().includes(normalized));
  }, [languages, query]);

  const chooseLanguage = (code: string) => {
    localStorage.setItem(STORAGE_KEY, code);
    setTranslationCookie(code);
    setCurrent(code);
    document.documentElement.lang = code;
    if (code === "fr") {
      setOpen(false);
      window.location.reload();
      return;
    }
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      window.location.reload();
    }
    setOpen(false);
  };

  return (
    <>
      <div id="google_translate_element" className="pointer-events-none fixed -left-[9999px] top-0 opacity-0" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="notranslate inline-flex h-10 items-center gap-1 rounded-full px-2.5 text-xs font-extrabold uppercase hover:bg-soft"
        aria-label="Choisir la langue"
      >
        <Globe2 className="size-4" />
        {current}
        <ChevronDown className="size-3.5" />
      </button>
      <Sheet open={open} onOpenChange={setOpen} title="Langue de l’espace commerçant" className="max-h-[82dvh]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Rechercher une langue" />
        </div>
        <p className="mt-3 text-xs text-mute">{languages.length > 1 ? `${languages.length} langues et variantes disponibles` : "Chargement des langues…"}</p>
        <div className="mt-3 max-h-[55dvh] space-y-1 overflow-y-auto overscroll-contain pr-1">
          {filtered.map((language) => (
            <button
              key={language.code}
              type="button"
              onClick={() => chooseLanguage(language.code)}
              className="notranslate flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold hover:bg-soft"
            >
              <span>{language.name}</span>
              <span className="flex items-center gap-2 text-xs font-bold uppercase text-mute">
                {language.code}
                {current === language.code ? <Check className="size-4 text-ink" /> : null}
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
