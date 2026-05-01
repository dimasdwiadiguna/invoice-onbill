-- Add bank_account field to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_account TEXT;

-- Create invoice-pdfs storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoice-pdfs',
  'invoice-pdfs',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: each user can only access their own folder ({user_id}/...)
CREATE POLICY "invoice_pdfs_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'invoice-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "invoice_pdfs_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoice-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "invoice_pdfs_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'invoice-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "invoice_pdfs_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'invoice-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
