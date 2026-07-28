-- Drop the restrictive policy that only shows paying clients
DROP POLICY IF EXISTS "App owner can view own app clients" ON public.app_clients;

-- Allow app owners to view all registered clients
CREATE POLICY "App owners can view all app clients"
ON public.app_clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.apps
    WHERE apps.user_id = auth.uid()
  )
);
