-- Fix Supabase linter warnings 0028 & 0029
-- SECURITY DEFINER functions that should be SECURITY INVOKER

-- 1. update_updated_at_column: only accesses NEW (trigger param), no elevated privileges needed
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- 2. handle_new_user: runs on auth.users trigger, needs to INSERT into public.profiles
--    Keep SECURITY DEFINER but ensure EXECUTE is revoked (already done in 20260715185141)
--    No change needed here — the REVOKE in the prior migration already blocks direct calls.
