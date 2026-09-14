/**
 * Deterministic FR polish for offer title/description (Épicerie Club tone).
 * Used when no LLM API key is configured.
 */

const TYPOS: Array<[RegExp, string]> = [
  [/\bmangue\b/gi, "mangue"],
  [/\bmangues\b/gi, "mangues"],
  [/\bcroissant\b/gi, "croissant"],
  [/\bcroissants\b/gi, "croissants"],
  [/\bpain\b/gi, "pain"],
  [/\bpains\b/gi, "pains"],
  [/\bfromage\b/gi, "fromage"],
  [/\byaourt\b/gi, "yaourt"],
  [/\byogourt\b/gi, "yaourt"],
  [/\bpromo\b/gi, "promo"],
  [/\barrivage\b/gi, "arrivage"],
  [/\bfrais\b/gi, "frais"],
  [/\bfraiches?\b/gi, "fraîches"],
  [/\bmures?\b/gi, "mûres"],
  [/\ba point\b/gi, "à point"],
  [/\bdu soir\b/gi, "du soir"],
];

function collapseSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function stripEmoji(s: string): string {
  // Avoid unicode flag / property escapes (tsconfig target default).
  return Array.from(s)
    .filter((ch) => {
      const cp = ch.codePointAt(0) || 0;
      if (cp >= 0x1f300 && cp <= 0x1faff) return false;
      if (cp >= 0x2600 && cp <= 0x27bf) return false;
      if (cp === 0xfe0f || cp === 0x200d) return false;
      return true;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function softTitleCase(s: string): string {
  if (!s) return s;
  // Don't force Title Case on every word — just fix ALL CAPS / leading case.
  if (s === s.toUpperCase() && s.length > 2) {
    s = s.toLowerCase();
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function applyTypos(s: string): string {
  let out = s;
  for (const [re, rep] of TYPOS) {
    out = out.replace(re, (m) => {
      if (m[0] && m[0] === m[0].toUpperCase()) {
        return rep.charAt(0).toUpperCase() + rep.slice(1);
      }
      return rep;
    });
  }
  return out;
}

function cutClean(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  if (sp >= Math.floor(max * 0.55)) return cut.slice(0, sp).trim();
  return cut.trim();
}

export function polishOfferCopyDeterministic(input: {
  title: string;
  description?: string;
  type?: string;
}): { title: string; description: string } {
  let title = softTitleCase(
    applyTypos(stripEmoji(collapseSpaces(input.title || "")))
  );
  title = cutClean(title, 45);

  let description = stripEmoji(collapseSpaces(input.description || ""));
  description = applyTypos(description);
  if (description) {
    description = softTitleCase(description);
    description = cutClean(description, 160);
  }

  return { title: title || "Offre du jour", description };
}
