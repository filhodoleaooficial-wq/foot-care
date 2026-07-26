
-- 1) PROFESSIONALS: add owner column, tighten policies
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Anyone can view professionals" ON public.professionals;
DROP POLICY IF EXISTS "Anyone can register as professional" ON public.professionals;
DROP POLICY IF EXISTS "Admins can update any professional" ON public.professionals;
DROP POLICY IF EXISTS "Admins can delete any professional" ON public.professionals;

CREATE POLICY "Authenticated can view professionals"
  ON public.professionals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can register as professional"
  ON public.professionals FOR INSERT
  TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owner can update own professional"
  ON public.professionals FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owner can delete own professional"
  ON public.professionals FOR DELETE
  TO authenticated
  USING (owner_user_id = auth.uid());

-- 2) COMMUNITY_POSTS: add app_id scoping, tighten SELECT
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS app_id uuid REFERENCES public.apps(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Anyone can view community posts" ON public.community_posts;

CREATE POLICY "Scoped community posts read"
  ON public.community_posts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      app_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.apps a
        WHERE a.id = community_posts.app_id
          AND a.user_id = auth.uid()
      )
    )
  );
