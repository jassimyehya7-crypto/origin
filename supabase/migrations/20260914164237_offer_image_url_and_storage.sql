-- Offer product photos: dedicated URL column + public Storage bucket.
-- Applied live: bucket `offer-photos` created via service-role JS (2026-09-14).
-- Column image_url: apply this migration in Supabase SQL editor if not yet present.
-- Until then, app stores URLs as image_emoji = 'url:' || public_url (transparent mappers).

ALTER TABLE public.ec_offers
  ADD COLUMN IF NOT EXISTS image_url text;

-- Public bucket for offer photos (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'offer-photos',
  'offer-photos',
  true,
  4194304,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read on offer-photos objects
DROP POLICY IF EXISTS "offer_photos_public_read" ON storage.objects;
CREATE POLICY "offer_photos_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'offer-photos');

-- Writes only via service role (bypasses RLS). No anon/authenticated insert/update/delete.
DROP POLICY IF EXISTS "offer_photos_no_anon_write" ON storage.objects;
-- Explicit deny not required when no write policies exist for anon.
