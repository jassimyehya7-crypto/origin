/**
 * One-shot: create public Storage bucket `offer-photos` (service role).
 * Usage: node --env-file=.env.local scripts/ensure-offer-photos-bucket.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: existing } = await sb.storage.listBuckets();
if (existing?.some((b) => b.name === "offer-photos")) {
  console.log("Bucket offer-photos already exists");
} else {
  const { error } = await sb.storage.createBucket("offer-photos", {
    public: true,
    fileSizeLimit: 4194304,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log("Created bucket offer-photos");
}

// Probe image_url column
const { error: colErr } = await sb.from("ec_offers").select("image_url").limit(1);
if (colErr) {
  console.warn(
    "NOTE: ec_offers.image_url missing — app uses image_emoji url: fallback.",
    "Apply supabase/migrations/20260914164237_offer_image_url_and_storage.sql in SQL editor."
  );
} else {
  console.log("Column image_url present");
}
