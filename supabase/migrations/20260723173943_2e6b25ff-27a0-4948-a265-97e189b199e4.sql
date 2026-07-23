
-- Subscriptions: remove public/true SELECT policy
DROP POLICY IF EXISTS "Clients read own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "App owner manage subscriptions" ON public.subscriptions;

CREATE POLICY "App owner manage own subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.apps a ON a.id = p.app_id
    WHERE p.id = subscriptions.product_id
      AND a.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.apps a ON a.id = p.app_id
    WHERE p.id = subscriptions.product_id
      AND a.user_id = auth.uid()
  )
);

-- App clients: scope owner SELECT to their own app's clients (via purchases)
DROP POLICY IF EXISTS "App owner can view clients" ON public.app_clients;

CREATE POLICY "App owner can view own app clients"
ON public.app_clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.product_purchases pp
    JOIN public.products p ON p.id = pp.product_id
    JOIN public.apps a ON a.id = p.app_id
    WHERE pp.client_id = app_clients.id
      AND a.user_id = auth.uid()
  )
);
