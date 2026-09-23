import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type LanguageToolMatch = {
  message: string;
  offset: number;
  length: number;
  replacements: Array<{ value: string }>;
};

const inputSchema = z.object({ text: z.string().trim().min(1).max(180) });

function commercialVocabulary(text: string): string {
  return text
    .replace(/\bfonta\b/gi, "Fanta")
    .replace(/\bcoca[ -]?cola\b/gi, "Coca Cola")
    .replace(/\bnutela\b/gi, "Nutella");
}

function chooseReplacement(match: LanguageToolMatch, source: string): string | undefined {
  const values = match.replacements.map((item) => item.value).filter(Boolean);
  if (!values.length) return undefined;
  const original = source.slice(match.offset, match.offset + match.length).toLocaleLowerCase("fr-CH");

  if (/des(?:s|z)?ert/.test(original)) {
    return values.find((value) => /\bdessert\b/i.test(value)) ?? values[0];
  }
  if (/déterminant|accord/i.test(match.message)) {
    const noun = original.trim().split(/\s+/).at(-1);
    return values.find((value) => noun && value.toLocaleLowerCase("fr-CH").endsWith(noun)) ?? values[0];
  }
  return values[0];
}

function applyMatches(source: string, matches: LanguageToolMatch[]): string {
  let result = source;
  for (const match of [...matches].sort((a, b) => b.offset - a.offset)) {
    const replacement = chooseReplacement(match, source);
    if (!replacement) continue;
    result = result.slice(0, match.offset) + replacement + result.slice(match.offset + match.length);
  }
  return result;
}

async function languageToolPass(text: string): Promise<string> {
  const body = new URLSearchParams({ text, language: "fr", enabledOnly: "false" });
  const response = await fetch("https://api.languagetool.org/v2/check", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`LanguageTool ${response.status}`);
  const data = await response.json() as { matches?: LanguageToolMatch[] };
  return applyMatches(text, data.matches ?? []);
}

export const correctOfferTitleOnline = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    let corrected = commercialVocabulary(data.text);
    corrected = await languageToolPass(corrected);
    corrected = await languageToolPass(corrected);
    corrected = corrected
      .replace(/\b(canettes?)\s+(?=(?:Fanta|Coca Cola)\b)/gi, "$1 de ")
      .replace(/[\-–—:;]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    corrected = corrected.charAt(0).toLocaleUpperCase("fr-CH") + corrected.slice(1);
    return { corrected, provider: "LanguageTool" as const };
  });
