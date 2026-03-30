
-- Make content-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'content-files';

-- Remove public read policy
DROP POLICY IF EXISTS "Anyone can view content files" ON storage.objects;

-- Add authenticated read policy (owner only)
CREATE POLICY "Users can view own content files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'content-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
