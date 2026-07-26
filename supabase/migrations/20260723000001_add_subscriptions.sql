-- Add recurring support to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS recurring BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.app_clients(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Only app owner can manage subscriptions
CREATE POLICY "App owner manage subscriptions" ON public.subscriptions
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM apps WHERE apps.user_id = auth.uid() LIMIT 1)
  );

-- Clients can read their own subscriptions (via client session)
CREATE POLICY "Clients read own subscriptions" ON public.subscriptions
  FOR SELECT TO public
  USING (true);

-- Note: After deploying, add stripe_webhook_secret to integration_settings:
-- UPDATE integration_settings SET credentials = credentials || '{"stripe_webhook_secret": "whsec_..."}' WHERE integration_name = 'stripe';

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
