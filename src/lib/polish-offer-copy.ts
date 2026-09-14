/**
 * Deterministic FR polish for offer title/description (Épicerie Club tone).
 * Used when no LLM API key is configured — and always as a typo pass.
 */

/** Exact / regex commerce typos (applied first). */
const TYPOS: Array<[RegExp, string]> = [
  [/\bmauto\b/gi, "moto"],
  [/\bvandr?e\b/gi, "vendre"],
  [/\bvandres\b/gi, "vendre"],
  [/\bcroisan(ts?)?\b/gi, "croissant$1"],
  [/\bcroissans\b/gi, "croissants"],
  [/\bmangue\b/gi, "mangue"],
  [/\bmangues\b/gi, "mangues"],
  [/\bmangues?\b/gi, "mangue"],
  [/\bfromag(e|es)?\b/gi, "fromage"],
  [/\bfromages\b/gi, "fromages"],
  [/\byaourt\b/gi, "yaourt"],
  [/\byogourt\b/gi, "yaourt"],
  [/\byaourts\b/gi, "yaourts"],
  [/\bfrigo\b/gi, "frigo"],
  [/\bfrigot\b/gi, "frigo"],
  [/\bpain\b/gi, "pain"],
  [/\bpains\b/gi, "pains"],
  [/\bpromo\b/gi, "promo"],
  [/\barrivage\b/gi, "arrivage"],
  [/\bfrais\b/gi, "frais"],
  [/\bfraiches?\b/gi, "fraîches"],
  [/\bmures?\b/gi, "mûres"],
  [/\ba point\b/gi, "à point"],
  [/\bdu soir\b/gi, "du soir"],
  [/\blot\b/gi, "lot"],
  [/\blots\b/gi, "lots"],
  [/\bprodui\b/gi, "produit"],
  [/\bproduits?\b/gi, "produit"],
  [/\bchocola\b/gi, "chocolat"],
  [/\bbanane\b/gi, "banane"],
  [/\bbananes\b/gi, "bananes"],
  [/\bpome\b/gi, "pomme"],
  [/\bpomes\b/gi, "pommes"],
  [/\bpomes?\b/gi, "pomme"],
  [/\bsalade\b/gi, "salade"],
  [/\bsalades\b/gi, "salades"],
  [/\bjus\b/gi, "jus"],
  [/\blait\b/gi, "lait"],
  [/\boeufs?\b/gi, "œuf"],
  [/\boeufs\b/gi, "œufs"],
  [/\bbeurre\b/gi, "beurre"],
  [/\bviande\b/gi, "viande"],
  [/\bpoulet\b/gi, "poulet"],
  [/\bpates\b/gi, "pâtes"],
  [/\briz\b/gi, "riz"],
  [/\bsoupe\b/gi, "soupe"],
  [/\bgateau\b/gi, "gâteau"],
  [/\bgateaux\b/gi, "gâteaux"],
  [/\btarte\b/gi, "tarte"],
  [/\btartes\b/gi, "tartes"],
  [/\bquiche\b/gi, "quiche"],
  [/\bsandwich\b/gi, "sandwich"],
  [/\bsandwiches\b/gi, "sandwiches"],
  [/\bvendre\b/gi, "vendre"],
  [/\ba vendre\b/gi, "à vendre"],
];

/** Dictionary for fuzzy (Levenshtein) correction of common FR commerce words. */
const DICT = [
  "moto",
  "vendre",
  "croissant",
  "croissants",
  "mangue",
  "mangues",
  "fromage",
  "fromages",
  "yaourt",
  "yaourts",
  "frigo",
  "pain",
  "pains",
  "promo",
  "arrivage",
  "frais",
  "fraîches",
  "mûres",
  "lot",
  "lots",
  "produit",
  "produits",
  "chocolat",
  "banane",
  "bananes",
  "pomme",
  "pommes",
  "salade",
  "salades",
  "jus",
  "lait",
  "œuf",
  "œufs",
  "beurre",
  "viande",
  "poulet",
  "pâtes",
  "riz",
  "soupe",
  "gâteau",
  "gâteaux",
  "tarte",
  "tartes",
  "quiche",
  "sandwich",
  "sandwiches",
  "offres",
  "offre",
  "panier",
  "paniers",
  "légumes",
  "fruits",
  "fromagerie",
  "boulangerie",
  "épicerie",
  "yaourt",
];

function collapseSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function stripEmoji(s: string): string {
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
  if (s === s.toUpperCase() && s.length > 2) {
    s = s.toLowerCase();
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function applyTypos(s: string): string {
  let out = s;
  for (const [re, rep] of TYPOS) {
    out = out.replace(re, (m) => {
      // Preserve simple capture groups like croissant$1
      let resolved = rep;
      if (rep.includes("$1")) {
        const match = m.match(re);
        const g1 = match?.[1] || "";
        resolved = rep.replace("$1", g1 === "s" || g1 === "ts" ? "s" : g1 ? "s" : "");
        // Normalize croissant / croissants
        if (/croissant/i.test(rep)) {
          const plural = /s$/i.test(m) || g1 === "s" || g1 === "ts";
          resolved = plural ? "croissants" : "croissant";
        }
      }
      if (m[0] && m[0] === m[0].toUpperCase()) {
        return resolved.charAt(0).toUpperCase() + resolved.slice(1);
      }
      return resolved;
    });
  }
  return out;
}

function normalizeKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) row[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = cur;
    }
  }
  return row[b.length];
}

function fuzzyCorrectWord(word: string): string {
  if (word.length < 3) return word;
  // Keep short connectors / known particles
  const lower = word.toLowerCase();
  if (["à", "a", "de", "du", "des", "le", "la", "les", "un", "une", "et", "ou", "au", "aux"].includes(lower)) {
    return lower === "a" ? "à" : word;
  }
  const key = normalizeKey(word);
  // Exact dict hit (accent-insensitive)
  for (const d of DICT) {
    if (normalizeKey(d) === key) {
      if (word[0] && word[0] === word[0].toUpperCase()) {
        return d.charAt(0).toUpperCase() + d.slice(1);
      }
      return d;
    }
  }
  // Skip likely proper nouns / nonsense brands if far from dict
  let best: string | null = null;
  let bestDist = Infinity;
  const maxDist = key.length <= 4 ? 1 : key.length <= 7 ? 2 : 2;
  for (const d of DICT) {
    const dk = normalizeKey(d);
    if (Math.abs(dk.length - key.length) > maxDist) continue;
    const dist = levenshtein(key, dk);
    if (dist < bestDist && dist > 0 && dist <= maxDist) {
      bestDist = dist;
      best = d;
    }
  }
  if (!best) return word;
  if (word[0] && word[0] === word[0].toUpperCase()) {
    return best.charAt(0).toUpperCase() + best.slice(1);
  }
  return best;
}

function fuzzyCorrectText(s: string): string {
  return s
    .split(/(\s+)/)
    .map((tok) => {
      if (/^\s+$/.test(tok)) return tok;
      // Split punctuation
      const m = tok.match(/^([«»"'(]*)(.*?)([)»"'\.,;:!?]*)$/);
      if (!m) return fuzzyCorrectWord(tok);
      const [, pre, core, post] = m;
      if (!core || !/^[A-Za-zÀ-ÿœŒ]+$/.test(core)) return tok;
      return pre + fuzzyCorrectWord(core) + post;
    })
    .join("");
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
    fuzzyCorrectText(
      applyTypos(stripEmoji(collapseSpaces(input.title || "")))
    )
  );
  title = cutClean(title, 45);

  let description = stripEmoji(collapseSpaces(input.description || ""));
  description = fuzzyCorrectText(applyTypos(description));
  if (description) {
    description = softTitleCase(description);
    description = cutClean(description, 160);
  }

  return { title: title || "Offre du jour", description };
}
