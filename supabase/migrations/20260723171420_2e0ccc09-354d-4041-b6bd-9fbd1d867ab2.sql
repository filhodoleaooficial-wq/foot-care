
CREATE POLICY "Anyone can view professional photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'professionals');

CREATE POLICY "Anyone can upload professional photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'professionals');
