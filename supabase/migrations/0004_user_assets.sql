-- Add avatar_url column to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create user-assets storage bucket (public for avatars/logos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-assets',
  'user-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone can read (public bucket), only owner can write
CREATE POLICY "user_assets_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'user-assets');

CREATE POLICY "user_assets_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "user_assets_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'user-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "user_assets_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'user-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
