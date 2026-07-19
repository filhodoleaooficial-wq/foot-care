-- Fix modules: allow public access to published modules (client users are not authenticated via Supabase Auth)
DROP POLICY IF EXISTS "Authenticated can view published modules" ON public.modules;
CREATE POLICY "Anyone can view published modules" ON public.modules
  FOR SELECT TO public
  USING (is_published = true);

-- Fix lessons: allow public access to published lessons
DROP POLICY IF EXISTS "Authenticated can view published lessons" ON public.lessons;
CREATE POLICY "Anyone can view published lessons" ON public.lessons
  FOR SELECT TO public
  USING (is_published = true);
