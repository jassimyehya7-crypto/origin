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

  const system = `Tu reformules des offres pour Épicerie Club (Villeneuve, CH).
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

  return NextResponse.json({ ...local, source: "local" });
}
