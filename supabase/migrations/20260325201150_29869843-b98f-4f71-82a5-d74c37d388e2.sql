
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view community posts"
  ON public.community_posts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Clients can insert own posts"
  ON public.community_posts FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Clients can delete own posts"
  ON public.community_posts FOR DELETE
  TO public
  USING (true);

CREATE TABLE public.saved_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email text NOT NULL,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_email, module_id)
);

ALTER TABLE public.saved_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view saved modules"
  ON public.saved_modules FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Clients can insert saved modules"
  ON public.saved_modules FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Clients can delete saved modules"
  ON public.saved_modules FOR DELETE
  TO public
  USING (true);
