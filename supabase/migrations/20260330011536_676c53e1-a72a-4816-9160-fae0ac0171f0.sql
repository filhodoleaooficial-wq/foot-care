
-- Add user_id column to app_clients, community_posts, saved_modules
ALTER TABLE app_clients ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE community_posts ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE saved_modules ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- === app_clients RLS ===
DROP POLICY IF EXISTS "Clients can view own data" ON app_clients;
DROP POLICY IF EXISTS "Clients can update own data" ON app_clients;
DROP POLICY IF EXISTS "Anyone can insert app_clients" ON app_clients;

CREATE POLICY "Clients can view own data" ON app_clients
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Clients can update own data" ON app_clients
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated can insert own client" ON app_clients
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- === community_posts RLS ===
DROP POLICY IF EXISTS "Anyone can view community posts" ON community_posts;
DROP POLICY IF EXISTS "Clients can insert own posts" ON community_posts;
DROP POLICY IF EXISTS "Clients can delete own posts" ON community_posts;

CREATE POLICY "Anyone can view community posts" ON community_posts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Clients can insert own posts" ON community_posts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Clients can delete own posts" ON community_posts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- === saved_modules RLS ===
DROP POLICY IF EXISTS "Anyone can view saved modules" ON saved_modules;
DROP POLICY IF EXISTS "Clients can insert saved modules" ON saved_modules;
DROP POLICY IF EXISTS "Clients can delete own saved modules" ON saved_modules;

CREATE POLICY "View own saved modules" ON saved_modules
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Insert own saved modules" ON saved_modules
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Delete own saved modules" ON saved_modules
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
