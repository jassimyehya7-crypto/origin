/**
 * Deterministic FR polish for offer title/description (OffresLocal tone).
 * Used when no LLM API key is configured — and always as a typo pass.
 */

/** Exact / regex commerce typos (applied first). */
const TYPOS: Array<[RegExp, string]> = [
  // Épicerie - produits courants
  [/\blocation\b/gi, "lot"],
  [/\blocasions?\b/gi, "occasion"],
  [/\bmauto\b/gi, "moto"],
  [/\bvandr?e\b/gi, "vendre"],
  [/\bvandres\b/gi, "vendre"],
  [/\bcroisan(ts?)?\b/gi, "croissant$1"],
  [/\bcroissans\b/gi, "croissants"],
  [/\bmangue\b/gi, "mangue"],
  [/\bmangues\b/gi, "mangues"],
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
  // Fruits et légumes (corrections de fautes uniquement)
  [/\btomatte\b/gi, "tomate"],
  [/\btomattes\b/gi, "tomates"],
  [/\bconcombre\b/gi, "concombre"],
  [/\bcourgete\b/gi, "courgette"],
  [/\bcourgetes\b/gi, "courgettes"],
  [/\bcarote\b/gi, "carotte"],
  [/\bcarotes\b/gi, "carottes"],
  [/\bepinard\b/gi, "épinard"],
  [/\bepinards\b/gi, "épinards"],
  [/\bpeche\b/gi, "pêche"],
  [/\bpeches\b/gi, "pêches"],
  [/\bpasteque\b/gi, "pastèque"],
  [/\bpasteques\b/gi, "pastèques"],
  // Produits laitiers et épicerie
  [/\byaourts?\b/gi, "yaourt"],
  [/\bfromages?\b/gi, "fromage"],
  [/\blait\b/gi, "lait"],
  [/\bcreme\b/gi, "crème"],
  [/\bcremes?\b/gi, "crème"],
  [/\bhuiles?\b/gi, "huile"],
  [/\bvinnaigres?\b/gi, "vinaigre"],
  [/\bsel\b/gi, "sel"],
  [/\bpoivre\b/gi, "poivre"],
  [/\bsucre\b/gi, "sucre"],
  [/\bfarine\b/gi, "farine"],
  [/\blevure\b/gi, "levure"],
  [/\bcafe\b/gi, "café"],
  [/\bthe\b/gi, "thé"],
  [/\btisanes?\b/gi, "tisane"],
  [/\beaux?\b/gi, "eau"],
  [/\bsodas?\b/gi, "soda"],
  [/\bbieres?\b/gi, "bière"],
  [/\bvins?\b/gi, "vin"],
  // Grammaire courante
  [/\bna\b/gi, "n'a"],
  [/\bca\b/gi, "ça"],
  [/\bsa\b(?=\s+[a-z])/gi, "ça"],
  [/\bces\b(?=\s+[a-z])/gi, "c'est"],
  [/\bses\b(?=\s+[a-z])/gi, "c'est"],
  [/\bpeut etre\b/gi, "peut-être"],
  [/\bpeut-etre\b/gi, "peut-être"],
  [/\bplusieurs\b/gi, "plusieurs"],
  [/\bquelques?\b/gi, "quelques"],
  [/\btres\b/gi, "très"],
  [/\bbien\b/gi, "bien"],
  [/\bmal\b/gi, "mal"],
  [/\bbon\b/gi, "bon"],
  [/\bbons?\b/gi, "bon"],
  [/\bbelles?\b/gi, "belle"],
  [/\bjolis?\b/gi, "joli"],
  [/\bnouveau\b/gi, "nouveau"],
  [/\bnouveaux?\b/gi, "nouveau"],
  [/\bancienne?\b/gi, "ancien"],
  [/\banciens?\b/gi, "ancien"],
  // Accents manquants courants
  [/\betat\b/gi, "état"],
  [/\bqualite\b/gi, "qualité"],
  [/\bquantite\b/gi, "quantité"],
  [/\bvelo\b/gi, "vélo"],
  [/\bvelos\b/gi, "vélos"],
  [/\bpiece\b/gi, "pièce"],
  [/\bpieces\b/gi, "pièces"],
  [/\bboite\b/gi, "boîte"],
  [/\bboites\b/gi, "boîtes"],
  [/\bcreme\b/gi, "crème"],
  [/\bcremes\b/gi, "crèmes"],
  [/\bcafe\b/gi, "café"],
  [/\bthe\b/gi, "thé"],
  [/\bepice\b/gi, "épice"],
  [/\bepices\b/gi, "épices"],
  [/\bepicerie\b/gi, "épicerie"],
  [/\bepinard\b/gi, "épinard"],
  [/\bepinards\b/gi, "épinards"],
];

/** Dictionary for fuzzy (Levenshtein) correction of common FR commerce words. */
const DICT = [
  // Actions / commerce
  "lot",
  "lots",
  "vendre",
  "à vendre",
  "promo",
  "arrivage",
  "offre",
  "offres",
  "prix",
  "réduction",
  "remise",
  "solde",
  "soldes",
  "panier",
  "paniers",
  "produit",
  "produits",
  "occasion",
  "occasions",
  // Fruits
  "mangue",
  "mangues",
  "banane",
  "bananes",
  "pomme",
  "pommes",
  "orange",
  "oranges",
  "citron",
  "citrons",
  "fraise",
  "fraises",
  "framboise",
  "framboises",
  "myrtille",
  "myrtilles",
  "raisin",
  "raisins",
  "poire",
  "poires",
  "pêche",
  "pêches",
  "abricot",
  "abricots",
  "cerise",
  "cerises",
  "prune",
  "prunes",
  "figue",
  "figues",
  "ananas",
  "kiwi",
  "kiwis",
  "melon",
  "melons",
  "pastèque",
  "pastèques",
  // Légumes
  "tomate",
  "tomates",
  "concombre",
  "concombres",
  "courgette",
  "courgettes",
  "aubergine",
  "aubergines",
  "poivron",
  "poivrons",
  "oignon",
  "oignons",
  "ail",
  "patate",
  "patates",
  "carotte",
  "carottes",
  "navet",
  "navets",
  "poireau",
  "poireaux",
  "épinard",
  "épinards",
  "haricot",
  "haricots",
  "petit pois",
  "petits pois",
  "salade",
  "salades",
  "légumes",
  "fruits",
  // Produits laitiers
  "fromage",
  "fromages",
  "yaourt",
  "yaourts",
  "lait",
  "crème",
  "beurre",
  "œuf",
  "œufs",
  // Boulangerie
  "pain",
  "pains",
  "croissant",
  "croissants",
  "baguette",
  "baguettes",
  "boulangerie",
  "pâtisserie",
  // Épicerie
  "huile",
  "huiles",
  "vinaigre",
  "sel",
  "poivre",
  "sucre",
  "farine",
  "levure",
  "café",
  "thé",
  "tisane",
  "tisanes",
  "eau",
  "soda",
  "sodas",
  "bière",
  "bières",
  "vin",
  "vins",
  "pâtes",
  "riz",
  "jus",
  "soupe",
  "chocolat",
  "gâteau",
  "gâteaux",
  "tarte",
  "tartes",
  "quiche",
  "sandwich",
  "sandwiches",
  "viande",
  "poulet",
  "frigo",
  "frais",
  "fraîches",
  "mûres",
  // Descriptifs
  "épicier",
  "épicerie",
  "fromagerie",
  "nouveau",
  "nouveaux",
  "ancien",
  "anciens",
  "bon",
  "bons",
  "belle",
  "belles",
  "joli",
  "jolis",
  "très",
  "bien",
  "plusieurs",
  "quelques",
  "à point",
  "du soir",
  "état",
  "voiture",
  "voitures",
  "vélo",
  "vélos",
  "scooter",
  "scooters",
  "moto",
  "motos",
  "appareil",
  "appareils",
  "machine",
  "machines",
  "lot",
  "occasion",
  "occasions",
  "qualité",
  "quantité",
  "pièce",
  "pièces",
  "kilo",
  "kilos",
  "litre",
  "litres",
  "boîte",
  "boîtes",
  "sachet",
  "sachets",
  "bouteille",
  "bouteilles",
  "pack",
  "packs",
  // Connnecteurs
  "à",
  "de",
  "du",
  "des",
  "le",
  "la",
  "les",
  "un",
  "une",
  "et",
  "ou",
  "au",
  "aux",
  "en",
  "avec",
  "pour",
  "sur",
  "sous",
  "dans",
  "par",
  "ce",
  "cette",
  "ces",
  "mon",
  "ma",
  "mes",
  "ton",
  "ta",
  "tes",
  "son",
  "sa",
  "ses",
  "notre",
  "nos",
  "votre",
  "vos",
  "leur",
  "leurs",
  // Mots courants
  "jour",
  "jours",
  "soir",
  "matin",
  "midi",
  "semaine",
  "mois",
  "année",
  "heure",
  "heures",
  "fois",
  "prix",
  "cher",
  "chère",
  "gratuit",
  "gratuite",
  "réduit",
  "réduite",
  "stock",
  "limité",
  "limitée",
  "disponible",
  "disponibles",
  "aujourd'hui",
  "demain",
  "ici",
  "là",
  "tout",
  "tous",
  "toute",
  "toutes",
  "autre",
  "autres",
  "même",
  "mêmes",
  "grand",
  "grande",
  "grands",
  "grandes",
  "petit",
  "petite",
  "petits",
  "petites",
  "gros",
  "grosse",
  "gros",
  "grosses",
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
  if (["à", "a", "de", "du", "des", "le", "la", "les", "un", "une", "et", "ou", "au", "aux", "en", "avec", "pour", "sur", "sous", "dans", "par"].includes(lower)) {
    return lower === "a" ? "à" : word;
  }
  const key = normalizeKey(word);
  // Exact dict hit (accent-insensitive) — always trust exact matches first
  for (const d of DICT) {
    if (normalizeKey(d) === key) {
      if (word[0] && word[0] === word[0].toUpperCase()) {
        return d.charAt(0).toUpperCase() + d.slice(1);
      }
      return d;
    }
  }
  // Only fuzzy-correct if word looks like a misspelling (contains no accents
  // that would make it valid, and is close to a dict word).
  // Be conservative: max distance 1 for short words, 1 for medium, 2 for long.
  let best: string | null = null;
  let bestDist = Infinity;
  const maxDist = key.length <= 4 ? 1 : 1;
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
}): { title: string; description: string; ambiguousWords?: Array<{ original: string; suggestions: string[] }> } {
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

  // Detect ambiguous / non-FR words
  const ambiguousWords = detectAmbiguousWords(input.title + " " + (input.description || ""));

  return { 
    title: title || "Offre du jour", 
    description,
    ...(ambiguousWords.length > 0 ? { ambiguousWords } : {}),
  };
}

/** Words that are clearly non-grocery in a grocery context */
const NON_GROCERY_WORDS = [
  "audi", "bmw", "mercedes", "renault", "peugeot", "citroen", "volkswagen",
  "voiture", "moto", "scooter", "vélo",
  "ordinateur", "laptop", "téléphone", "iphone", "samsung",
  "canapé", "table", "chaise", "lit", "armoire",
  "location", "louer", "loyer",
];

/** Common double-letter typos */
const DOUBLE_LETTER_FIXES: Array<[RegExp, string]> = [
  [/\b(\w{2,}?)\1{2,}\b/gi, "$1$1"], // e.g. "bonnne" → "bonne"
  [/\bbonnne\b/gi, "bonne"],
  [/\bbonnnes\b/gi, "bonnes"],
  [/\bmangueee\b/gi, "mangue"],
  [/\bfraisss\b/gi, "frais"],
  [/\bbellle\b/gi, "belle"],
  [/\bbellles\b/gi, "belles"],
  [/\bgrossse\b/gi, "grosse"],
  [/\bgrossses\b/gi, "grosses"],
  [/\bpommees\b/gi, "pommes"],
  [/\btommate\b/gi, "tomate"],
  [/\btommates\b/gi, "tomates"],
  [/\barrivvage\b/gi, "arrivage"],
  [/\bpromoo\b/gi, "promo"],
];

function detectAmbiguousWords(text: string): Array<{ original: string; suggestions: string[] }> {
  const words = text.split(/\s+/).filter(Boolean);
  const result: Array<{ original: string; suggestions: string[] }> = [];
  
  for (const word of words) {
    const lower = word.toLowerCase();
    
    // Check for double-letter typos
    const doubleFixed = applyDoubleLetterFixes(word);
    if (doubleFixed !== word) {
      result.push({ original: word, suggestions: [doubleFixed] });
      continue;
    }
    
    // Check for non-grocery words (context mismatch for grocery shop)
    if (NON_GROCERY_WORDS.some(ng => lower.includes(ng))) {
      // Don't flag — let the merchant decide
    }
    
    // Check for words that don't look French
    if (looksNonFrench(lower) && lower.length >= 4) {
      const alts = findClosestFrenchWords(lower);
      if (alts.length > 0) {
        result.push({ original: word, suggestions: alts });
      }
    }
  }
  
  return result;
}

function applyDoubleLetterFixes(word: string): string {
  let out = word;
  for (const [re, rep] of DOUBLE_LETTER_FIXES) {
    out = out.replace(re, rep);
  }
  // General triple+ letter fix
  out = out.replace(/(.)\1{2,}/g, "$1$1");
  return out;
}

function looksNonFrench(word: string): boolean {
  // Common non-French patterns
  const normalized = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  // Check for letter combos unusual in French
  if (/w/.test(normalized) && !/wi-fi|wifi/.test(normalized)) return false; // W is rare but possible
  if (/k[^s]/.test(normalized) && normalized.length > 3) return false; // K is rare
  // Check if word is completely unknown to dictionary
  const inDict = DICT.some(d => d.toLowerCase() === word.toLowerCase());
  if (inDict) return false;
  // Check typo list
  const inTypos = TYPOS.some(([re]) => re.test(word));
  if (inTypos) return false;
  return false; // Conservative: don't flag as non-FR unless clearly wrong
}

function findClosestFrenchWords(word: string): string[] {
  const key = normalizeKey(word);
  const candidates: Array<{ word: string; dist: number }> = [];
  
  for (const d of DICT) {
    const dk = normalizeKey(d);
    const dist = levenshtein(key, dk);
    if (dist > 0 && dist <= 2 && Math.abs(dk.length - key.length) <= 2) {
      candidates.push({ word: d, dist });
    }
  }
  
  candidates.sort((a, b) => a.dist - b.dist);
  return candidates.slice(0, 3).map(c => c.word);
}
