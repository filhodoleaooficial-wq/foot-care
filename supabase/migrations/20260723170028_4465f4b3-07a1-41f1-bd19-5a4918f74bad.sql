-- Fix 1: quiz_questions (não tem coluna user_id; escopar via apps.user_id)
DROP POLICY IF EXISTS "Authenticated can manage quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Admins can manage quiz questions" ON public.quiz_questions;
CREATE POLICY "Admins can manage quiz questions"
ON public.quiz_questions
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.apps a WHERE a.id = quiz_questions.app_id AND a.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.apps a WHERE a.id = quiz_questions.app_id AND a.user_id = auth.uid()));

-- Fix 2: app_clients — visível apenas ao dono de qualquer app
DROP POLICY IF EXISTS "Admins can view all clients" ON public.app_clients;
DROP POLICY IF EXISTS "App owner can view clients" ON public.app_clients;
CREATE POLICY "App owner can view clients"
ON public.app_clients
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.apps WHERE apps.user_id = auth.uid()));

-- Fix 3: Storage app-assets — apenas dono da pasta (uid) pode ler/escrever
DROP POLICY IF EXISTS "Anyone can read app-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Admin read own files" ON storage.objects;
DROP POLICY IF EXISTS "Admin update own files" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete own files" ON storage.objects;

CREATE POLICY "Admin upload own files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'app-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admin read own files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'app-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admin update own files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'app-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admin delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'app-assets' AND (storage.foldername(name))[1] = auth.uid()::text);