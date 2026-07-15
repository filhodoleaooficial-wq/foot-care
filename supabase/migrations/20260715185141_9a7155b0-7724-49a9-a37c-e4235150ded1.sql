
-- 1. Revoke EXECUTE on SECURITY DEFINER trigger-only functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 2. Drop the storage.objects SELECT policy that allows listing app-assets bucket.
-- Public URLs still resolve directly via the storage CDN without a SELECT policy.
DROP POLICY IF EXISTS "Anyone can view app assets" ON storage.objects;

-- 3. Remove client_email from community_posts to eliminate PII exposure
ALTER TABLE public.community_posts DROP COLUMN IF EXISTS client_email;

-- 4. Lock down integration_settings — only service_role (edge functions) may access.
DROP POLICY IF EXISTS "Edge functions can read integration settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Admins can manage integration settings" ON public.integration_settings;
REVOKE ALL ON public.integration_settings FROM anon, authenticated;
GRANT ALL ON public.integration_settings TO service_role;

-- 5. Lock down product_purchases — only service_role reads/writes; frontend goes through an edge function.
DROP POLICY IF EXISTS "Anyone can view purchases" ON public.product_purchases;
REVOKE ALL ON public.product_purchases FROM anon, authenticated;
GRANT ALL ON public.product_purchases TO service_role;
