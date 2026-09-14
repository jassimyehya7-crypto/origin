import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { PRO_SHOP_ID } from "@/lib/pro-shop";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function POST(req: NextRequest) {
  const gate = requireStaff(req, "pro");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const sb = createServiceClient();
  if (!sb) {
    return NextResponse.json(
      { error: "Storage non configuré (service role manquant)" },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  const blob = file as File;
  const mime = (blob.type || "image/jpeg").toLowerCase();
  if (!ALLOWED.has(mime)) {
    return NextResponse.json(
      { error: "Format accepté : JPEG, PNG ou WebP" },
      { status: 400 }
    );
  }
  if (blob.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image trop lourde (max 4 Mo)" },
      { status: 400 }
    );
  }

  const shopId =
    (typeof form.get("shopId") === "string" && String(form.get("shopId"))) ||
    PRO_SHOP_ID;
  const buf = Buffer.from(await blob.arrayBuffer());
  const path = `${shopId}/${randomUUID()}.${extFor(mime)}`;

  const { error } = await sb.storage.from("offer-photos").upload(path, buf, {
    contentType: mime,
    upsert: false,
  });
  if (error) {
    console.error("[offer-photo]", error.message);
    return NextResponse.json(
      { error: "Échec de l'upload" },
      { status: 500 }
    );
  }

  const { data } = sb.storage.from("offer-photos").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
