-- Messages from Pro shops to the founder (text and/or audio)
CREATE TABLE IF NOT EXISTS public.ec_founder_messages (
  id text PRIMARY KEY,
  shop_id text NOT NULL REFERENCES public.ec_shops(id) ON DELETE CASCADE,
  body text,
  audio_url text,
  status text NOT NULL DEFAULT 'nouveau',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ec_founder_messages_status_check
    CHECK (status = ANY (ARRAY['nouveau'::text, 'lu'::text, 'traite'::text])),
  CONSTRAINT ec_founder_messages_content_check
    CHECK (body IS NOT NULL OR audio_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS ec_founder_messages_shop_idx
  ON public.ec_founder_messages(shop_id);
CREATE INDEX IF NOT EXISTS ec_founder_messages_status_idx
  ON public.ec_founder_messages(status);
CREATE INDEX IF NOT EXISTS ec_founder_messages_created_idx
  ON public.ec_founder_messages(created_at DESC);

REVOKE ALL ON public.ec_founder_messages FROM anon, authenticated;

ALTER TABLE public.ec_founder_messages ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'founder-messages',
  'founder-messages',
  true,
  10485760,
  ARRAY['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "founder_messages_public_read" ON storage.objects;
CREATE POLICY "founder_messages_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'founder-messages');
