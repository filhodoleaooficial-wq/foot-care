DROP TABLE IF EXISTS public.module_purchases;

CREATE TABLE public.product_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.app_clients(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  amount numeric,
  stripe_session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (client_id, product_id)
);

GRANT SELECT ON public.product_purchases TO anon;
GRANT SELECT ON public.product_purchases TO authenticated;
GRANT ALL ON public.product_purchases TO service_role;

ALTER TABLE public.product_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view purchases"
ON public.product_purchases
FOR SELECT
USING (true);

CREATE TRIGGER update_product_purchases_updated_at
BEFORE UPDATE ON public.product_purchases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();