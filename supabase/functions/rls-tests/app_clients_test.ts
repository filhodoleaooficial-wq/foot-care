// Deno test: verifies RLS on public.app_clients.
// A user only sees rows when they own at least one app (apps.user_id = auth.uid()).

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("app_clients RLS: only users who own an app can read client rows", async () => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const suffix = crypto.randomUUID().slice(0, 8);
  const ownerEmail = `owner-${suffix}@rls.test`;
  const otherEmail = `other-${suffix}@rls.test`;
  const password = "Test1234!xyzABC";

  // Create two auth users
  const { data: owner, error: e1 } = await admin.auth.admin.createUser({
    email: ownerEmail,
    password,
    email_confirm: true,
  });
  if (e1) throw e1;
  const { data: other, error: e2 } = await admin.auth.admin.createUser({
    email: otherEmail,
    password,
    email_confirm: true,
  });
  if (e2) throw e2;

  const ownerId = owner.user!.id;
  const otherId = other.user!.id;

  // Owner has an app; other user has none
  const { data: app, error: e3 } = await admin
    .from("apps")
    .insert({ user_id: ownerId, name: `rls-test-${suffix}` })
    .select()
    .single();
  if (e3) throw e3;

  // Seed one app_client row (columns are global; RLS gates visibility)
  const { data: client, error: e4 } = await admin
    .from("app_clients")
    .insert({
      email: `client-${suffix}@rls.test`,
      age: 30,
      gender: "other",
    })
    .select()
    .single();
  if (e4) throw e4;

  try {
    // --- Owner signs in and should see the row ---
    const ownerClient = createClient(SUPABASE_URL, ANON, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: se1 } = await ownerClient.auth.signInWithPassword({
      email: ownerEmail,
      password,
    });
    if (se1) throw se1;

    const { data: ownerRows, error: qe1 } = await ownerClient
      .from("app_clients")
      .select("id")
      .eq("id", client.id);
    if (qe1) throw qe1;
    assertEquals(
      ownerRows?.length,
      1,
      "app owner must see the client row (apps.user_id = auth.uid())",
    );

    // --- Other user signs in with no app and must see nothing ---
    const otherClient = createClient(SUPABASE_URL, ANON, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: se2 } = await otherClient.auth.signInWithPassword({
      email: otherEmail,
      password,
    });
    if (se2) throw se2;

    const { data: otherRows, error: qe2 } = await otherClient
      .from("app_clients")
      .select("id")
      .eq("id", client.id);
    if (qe2) throw qe2;
    assertEquals(
      otherRows?.length,
      0,
      "user without an app must NOT see any client rows",
    );
  } finally {
    // Cleanup
    await admin.from("app_clients").delete().eq("id", client.id);
    await admin.from("apps").delete().eq("id", app.id);
    await admin.auth.admin.deleteUser(ownerId);
    await admin.auth.admin.deleteUser(otherId);
  }
});
