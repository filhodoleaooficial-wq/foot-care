
CREATE TYPE public.professional_category AS ENUM ('fisica', 'mental', 'espiritual');

CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category public.professional_category NOT NULL,
  activity TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  whatsapp TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  instagram TEXT,
  website TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.professionals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professionals TO authenticated;
GRANT ALL ON public.professionals TO service_role;

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view professionals"
  ON public.professionals FOR SELECT
  USING (true);

CREATE POLICY "Anyone can register as professional"
  ON public.professionals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update any professional"
  ON public.professionals FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.apps a WHERE a.user_id = auth.uid()));

CREATE POLICY "Admins can delete any professional"
  ON public.professionals FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.apps a WHERE a.user_id = auth.uid()));

CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX professionals_category_idx ON public.professionals (category);
CREATE INDEX professionals_created_at_idx ON public.professionals (created_at DESC);
