
-- Fix storage ownership policies for content-files bucket
DROP POLICY IF EXISTS "Authenticated users can delete content files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update content files" ON storage.objects;

CREATE POLICY "Users can delete own content files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'content-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own content files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'content-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Fix storage ownership policies for app-assets bucket
DROP POLICY IF EXISTS "Users can delete own app assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own app assets" ON storage.objects;

CREATE POLICY "Users can delete own app assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'app-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own app assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'app-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
