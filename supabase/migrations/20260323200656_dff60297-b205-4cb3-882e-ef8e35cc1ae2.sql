CREATE TABLE public.app_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL DEFAULT 'feminino',
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert app_clients" ON public.app_clients FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Clients can view own data" ON public.app_clients FOR SELECT TO public USING (true);
CREATE POLICY "Clients can update own data" ON public.app_clients FOR UPDATE TO public USING (true);