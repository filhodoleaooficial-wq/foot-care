-- Allow authenticated users (admins) to view all app_clients
CREATE POLICY "Admins can view all clients"
  ON app_clients
  FOR SELECT
  TO authenticated
  USING (true);
