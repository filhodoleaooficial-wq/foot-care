
-- 1. app_clients: remove overly broad admin SELECT policy. Only owners (app admin via service_role edge functions) and the client themselves should read.
DROP POLICY IF EXISTS "Admins can view all clients" ON public.app_clients;

-- 2. quiz_questions: restrict writes to app owner
DROP POLICY IF EXISTS "Authenticated can manage quiz questions" ON public.quiz_questions;
CREATE POLICY "App owners can manage their quiz questions"
ON public.quiz_questions
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.apps a WHERE a.id = quiz_questions.app_id AND a.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.apps a WHERE a.id = quiz_questions.app_id AND a.user_id = auth.uid()));

-- 3. content-files bucket: remove public SELECT; access is served via get-signed-url edge function (service_role)
DROP POLICY IF EXISTS "Anyone can read content-files" ON storage.objects;

-- 4. app-assets bucket: remove broad SELECT policy that allows listing. Public bucket URLs still resolve via the public CDN without needing a policy.
DROP POLICY IF EXISTS "Anyone can read app-assets" ON storage.objects;
