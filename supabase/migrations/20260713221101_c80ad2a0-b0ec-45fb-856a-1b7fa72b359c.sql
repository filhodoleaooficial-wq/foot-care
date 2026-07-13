-- Add phone to app_clients
ALTER TABLE public.app_clients ADD COLUMN IF NOT EXISTS phone text;

-- Allow anonymous clients to be created/read (simple login, no auth)
GRANT SELECT, INSERT, UPDATE ON public.app_clients TO anon;

-- Module purchases (one-time payment per module)
CREATE TABLE public.module_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.app_clients(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  amount numeric,
  stripe_session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (client_id, module_id)
);

GRANT SELECT ON public.module_purchases TO anon;
GRANT SELECT ON public.module_purchases TO authenticated;
GRANT ALL ON public.module_purchases TO service_role;

ALTER TABLE public.module_purchases ENABLE ROW LEVEL SECURITY;

-- Anyone can read purchases (to know what is unlocked); writes happen only via service_role edge functions
CREATE POLICY "Anyone can view purchases"
ON public.module_purchases
FOR SELECT
USING (true);

CREATE TRIGGER update_module_purchases_updated_at
BEFORE UPDATE ON public.module_purchases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();