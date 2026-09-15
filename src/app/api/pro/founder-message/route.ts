import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireStaff } from "@/lib/staff-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { PRO_SHOP_ID } from "@/lib/pro-shop";
import { createFounderMessage, getShop } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const ALLOWED_AUDIO = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-m4a",
  "audio/aac",
  "audio/webm;codecs=opus",
]);

function extFor(mime: string): string {
  const base = mime.split(";")[0].trim().toLowerCase();
  if (base === "audio/ogg") return "ogg";
  if (base === "audio/mp4" || base === "audio/x-m4a" || base === "audio/aac")
    return "m4a";
  if (base === "audio/mpeg") return "mp3";
  if (base === "audio/wav") return "wav";
  return "webm";
}

function audioAllowed(mime: string): boolean {
  const base = mime.split(";")[0].trim().toLowerCase();
  return (
    ALLOWED_AUDIO.has(mime.toLowerCase()) ||
    ALLOWED_AUDIO.has(base) ||
    base.startsWith("audio/")
  );
}

export async function POST(req: NextRequest) {
  const gate = requireStaff(req, "pro");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });
  }

  // Pro can only message as their own shop (pilot: PRO_SHOP_ID)
  const requested =
    typeof form.get("shopId") === "string" ? String(form.get("shopId")) : "";
  const shopId = requested && requested === PRO_SHOP_ID ? requested : PRO_SHOP_ID;

  const shop = await getShop(shopId);
  if (!shop) {
    return NextResponse.json({ error: "Magasin introuvable" }, { status: 404 });
  }

  const bodyRaw = form.get("body");
  const body =
    typeof bodyRaw === "string" ? bodyRaw.trim().slice(0, 4000) : "";

  const file = form.get("audio");
  let audioUrl: string | undefined;

  if (file && typeof file !== "string") {
    const blob = file as File;
    const mime = (blob.type || "audio/webm").toLowerCase();
    if (!audioAllowed(mime)) {
      return NextResponse.json(
        { error: "Format audio non supporté" },
        { status: 400 }
      );
    }
    if (blob.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "Audio trop lourd (max 10 Mo)" },
        { status: 400 }
      );
    }

    const sb = createServiceClient();
    if (!sb) {
      return NextResponse.json(
        { error: "Storage non configuré (service role manquant)" },
        { status: 503 }
      );
    }

    const buf = Buffer.from(await blob.arrayBuffer());
    const path = `${shopId}/${randomUUID()}.${extFor(mime)}`;
    const { error } = await sb.storage
      .from("founder-messages")
      .upload(path, buf, {
        contentType: mime.split(";")[0].trim(),
        upsert: false,
      });
    if (error) {
      console.error("[founder-message audio]", error.message);
      return NextResponse.json(
        { error: "Échec de l'upload audio" },
        { status: 500 }
      );
    }
    const { data } = sb.storage.from("founder-messages").getPublicUrl(path);
    audioUrl = data.publicUrl;
  }

  if (!body && !audioUrl) {
    return NextResponse.json(
      { error: "Message vide — texte ou audio requis" },
      { status: 400 }
    );
  }

  const message = await createFounderMessage({
    shopId,
    body: body || undefined,
    audioUrl,
  });

  return NextResponse.json({ message });
}
