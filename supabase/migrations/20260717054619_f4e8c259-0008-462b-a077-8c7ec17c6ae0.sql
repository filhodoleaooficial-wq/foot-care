
DROP POLICY IF EXISTS "Authenticated users can upload app assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload app assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'app-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can upload content files" ON storage.objects;
CREATE POLICY "Authenticated users can upload content files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'content-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
