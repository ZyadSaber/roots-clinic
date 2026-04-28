-- Storage RLS policies for the insurance-claims bucket
-- Run after creating the bucket in Supabase Storage dashboard

INSERT INTO storage.buckets (id, name, public)
VALUES ('insurance-claims', 'insurance-claims', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload insurance claim documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'insurance-claims');

CREATE POLICY "Authenticated users can update insurance claim documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'insurance-claims');

CREATE POLICY "Anyone can view insurance claim documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'insurance-claims');
