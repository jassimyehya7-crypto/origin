import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";
import { polishOfferCopyDeterministic } from "@/lib/polish-offer-copy";

export const dynamic = "force-dynamic";

async function polishWithLlm(input: {
  title: string;
  description?: string;
  type?: string;
}): Promise<{ title: string; description: string } | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const xaiKey = process.env.XAI_API_KEY;
  if (!openaiKey && !xaiKey) return null;

  const baseUrl = xaiKey
    ? "https://api.x.ai/v1"
    : "https://api.openai.com/v1";
  const key = xaiKey || openaiKey!;
  const model = xaiKey ? "grok-2-latest" : "gpt-4o-mini";

  const system = `Tu reformules des offres pour OffresLocal (Villeneuve, CH).
Règles: français clair et chaleureux, zéro emoji, titre ≤ 45 caractères, description courte si fournie.
Corrige les fautes (ex. mauto→moto, vandre→vendre, croisan→croissant) sans inventer de produit.
Style commerçant de quartier — concret, appétissant, sans superlatifs creux.
Réponds UNIQUEMENT en JSON: {"title":"...","description":"..."}`;

  const user = JSON.stringify({
    title: input.title,
    description: input.description || "",
    type: input.type || "",
  });

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      console.warn("[polish-offer] LLM HTTP", res.status);
      return null;
    }
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      title?: string;
      description?: string;
    };
    if (!parsed.title || typeof parsed.title !== "string") return null;
    return {
      title: parsed.title.trim().slice(0, 45),
      description: (parsed.description || "").trim().slice(0, 160),
    };
  } catch (e) {
    console.warn("[polish-offer] LLM failed", e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const gate = requireStaff(req, "pro");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  let body: { title?: string; description?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const title = (body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  }

  // Always run deterministic typo polish first (works without API keys).
  const local = polishOfferCopyDeterministic({
    title,
    description: body.description,
    type: body.type,
  });

  const llm = await polishWithLlm({
    title: local.title,
    description: local.description,
    type: body.type,
  });
  if (llm) {
    // Re-apply deterministic on LLM output to catch residual typos.
    const merged = polishOfferCopyDeterministic({
      title: llm.title,
      description: llm.description,
      type: body.type,
    });
    return NextResponse.json({ ...merged, source: "llm" });
  }

  // Generate marketing suggestions based on offer type
  const suggestions = generateMarketingSuggestions({
    title: local.title,
    description: local.description,
    type: body.type,
  });

  return NextResponse.json({ 
    ...local, 
    suggestions,
    source: "local" 
  });
}

function generateMarketingSuggestions(input: {
  title: string;
  description?: string;
  type?: string;
}): string[] {
  const type = input.type || "PROMO";
  const title = input.title;
  
  // Context detection
  const isFruit = /mangue|banane|pomme|orange|citron|fraise|framboise|myrtille|raisin|poire|pêche|abricot|cerise|prune|figue|ananas|kiwi|melon|pastèque/i.test(title);
  const isVegetable = /tomate|concombre|courgette|aubergine|poivron|oignon|ail|patate|carotte|navet|poireau|épinard|haricot|salade|légume/i.test(title);
  const isDairy = /fromage|yaourt|lait|crème|beurre|œuf/i.test(title);
  const isBakery = /pain|croissant|baguette|pâtisserie|gâteau|tarte|quiche/i.test(title);
  const isEpicerie = isFruit || isVegetable || isDairy || isBakery;
  
  const isArrivage = type === "ARRIVAGE";
  const isFlash = type === "FLASH";
  const isPromo = type === "PROMO";
  const isDerniereMinute = type === "DERNIERE_MINUTE";

  const suggestions: string[] = [];

  // Keep the original title as-is for marketing suggestions (it's already corrected)
  const product = title;

  if (isArrivage) {
    if (isFruit) {
      suggestions.push(`Nouvel arrivage : ${product.toLowerCase()}`);
      suggestions.push(`${product}, fraîcheur garantie`);
      suggestions.push(`${product} fraîchement reçu`);
    } else if (isVegetable) {
      suggestions.push(`Nouvel arrivage : ${product.toLowerCase()}`);
      suggestions.push(`${product} du jour`);
      suggestions.push(`${product}, fraîcheur garantie`);
    } else if (isDairy || isBakery) {
      suggestions.push(`Nouvel arrivage : ${product.toLowerCase()}`);
      suggestions.push(`${product} du jour`);
      suggestions.push(`${product}, fraîchement reçu`);
    } else {
      suggestions.push(`Nouvel arrivage : ${product.toLowerCase()}`);
      suggestions.push(`${product} vient d'arriver`);
      suggestions.push(`Arrivage frais : ${product.toLowerCase()}`);
    }
  } else if (isFlash) {
    suggestions.push(`${product} en offre flash`);
    suggestions.push(`Offre du jour : ${product.toLowerCase()}`);
    if (isEpicerie) {
      suggestions.push(`${product} à prix flash`);
    } else {
      suggestions.push(`Prix flash : ${product.toLowerCase()}`);
    }
  } else if (isPromo) {
    suggestions.push(`${product} en promo`);
    suggestions.push(`Belle affaire : ${product.toLowerCase()}`);
    if (isEpicerie) {
      suggestions.push(`${product} à prix réduit`);
    } else {
      suggestions.push(`${product} prix spécial`);
    }
  } else if (isDerniereMinute) {
    suggestions.push(`${product}, dernière chance`);
    suggestions.push(`Dernière chance : ${product.toLowerCase()}`);
    suggestions.push(`${product} avant épuisement`);
  } else {
    suggestions.push(`${product} à découvrir`);
    suggestions.push(`Belle opportunité : ${product.toLowerCase()}`);
    suggestions.push(`${product} en offre`);
  }

  return suggestions.slice(0, 3);
}
