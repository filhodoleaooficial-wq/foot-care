-- Create content-files bucket for PDFs, videos, MP3s, ZIPs (500MB max)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-files',
  'content-files',
  true,
  524288000,
  ARRAY['application/pdf', 'video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 524288000, allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS policies for content-files bucket
CREATE POLICY "Anyone can view content files" ON storage.objects FOR SELECT USING (bucket_id = 'content-files');
CREATE POLICY "Authenticated users can upload content files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'content-files');
CREATE POLICY "Authenticated users can update content files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'content-files');
CREATE POLICY "Authenticated users can delete content files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'content-files');