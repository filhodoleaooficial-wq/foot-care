-- Fix community_posts: tighten SELECT to authenticated only (already is) but this is fine
-- The real fix is in code - stop selecting client_email

-- Fix lessons: restrict published lessons to authenticated users only
DROP POLICY IF EXISTS "Anyone can view published lessons" ON public.lessons;
CREATE POLICY "Authenticated can view published lessons" ON public.lessons
  FOR SELECT TO authenticated
  USING (is_published = true);

-- Fix modules: also restrict to authenticated (modules contain content structure)
DROP POLICY IF EXISTS "Anyone can view published modules" ON public.modules;
CREATE POLICY "Authenticated can view published modules" ON public.modules
  FOR SELECT TO authenticated
  USING (is_published = true);