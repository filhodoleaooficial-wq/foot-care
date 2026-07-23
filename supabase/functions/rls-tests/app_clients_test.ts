// Deno tests: RLS on public.app_clients.
// - Owner (a user with an app) sees rows.
// - Other user (no app) sees nothing, even across paginated queries.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signedInClient(email: string, password: string): Promise<SupabaseClient> {
  const c = createClient(SUPABASE_URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return c;
}

Deno.test("app_clients RLS: only users who own an app can read client rows", async () => {
  const admin = adminClient();
  const suffix = crypto.randomUUID().slice(0, 8);
  const ownerEmail = `owner-${suffix}@rls.test`;
  const otherEmail = `other-${suffix}@rls.test`;
  const password = "Test1234!xyzABC";

  const { data: owner, error: e1 } = await admin.auth.admin.createUser({
    email: ownerEmail, password, email_confirm: true,
  });
  if (e1) throw e1;
  const { data: other, error: e2 } = await admin.auth.admin.createUser({
    email: otherEmail, password, email_confirm: true,
  });
  if (e2) throw e2;

  const { data: app, error: e3 } = await admin
    .from("apps")
    .insert({ user_id: owner.user!.id, name: `rls-test-${suffix}` })
    .select().single();
  if (e3) throw e3;

  const { data: client, error: e4 } = await admin
    .from("app_clients")
    .insert({ email: `client-${suffix}@rls.test`, age: 30, gender: "other" })
    .select().single();
  if (e4) throw e4;

  try {
    const ownerC = await signedInClient(ownerEmail, password);
    const { data: ownerRows, error: qe1 } = await ownerC
      .from("app_clients").select("id").eq("id", client.id);
    if (qe1) throw qe1;
    assertEquals(ownerRows?.length, 1, "app owner must see the client row");

    const otherC = await signedInClient(otherEmail, password);
    const { data: otherRows, error: qe2 } = await otherC
      .from("app_clients").select("id").eq("id", client.id);
    if (qe2) throw qe2;
    assertEquals(otherRows?.length, 0, "user without an app must NOT see any client rows");
  } finally {
    await admin.from("app_clients").delete().eq("id", client.id);
    await admin.from("apps").delete().eq("id", app.id);
    await admin.auth.admin.deleteUser(owner.user!.id);
    await admin.auth.admin.deleteUser(other.user!.id);
  }
});

Deno.test("app_clients RLS: pagination (limit/offset) still respects ownership", async () => {
  const admin = adminClient();
  const suffix = crypto.randomUUID().slice(0, 8);
  const ownerEmail = `owner-p-${suffix}@rls.test`;
  const otherEmail = `other-p-${suffix}@rls.test`;
  const password = "Test1234!xyzABC";
  const TAG = `pag-${suffix}`;
  const TOTAL = 7;
  const PAGE = 3;

  const { data: owner, error: e1 } = await admin.auth.admin.createUser({
    email: ownerEmail, password, email_confirm: true,
  });
  if (e1) throw e1;
  const { data: other, error: e2 } = await admin.auth.admin.createUser({
    email: otherEmail, password, email_confirm: true,
  });
  if (e2) throw e2;

  const { data: app, error: e3 } = await admin
    .from("apps")
    .insert({ user_id: owner.user!.id, name: `rls-pag-${suffix}` })
    .select().single();
  if (e3) throw e3;

  // Seed TOTAL client rows tagged so we can isolate them
  const rows = Array.from({ length: TOTAL }, (_, i) => ({
    email: `${TAG}-${i}@rls.test`,
    age: 20 + i,
    gender: "other",
  }));
  const { data: inserted, error: e4 } = await admin
    .from("app_clients").insert(rows).select("id");
  if (e4) throw e4;
  const insertedIds = inserted!.map((r) => r.id);

  try {
    const ownerC = await signedInClient(ownerEmail, password);
    const otherC = await signedInClient(otherEmail, password);

    // --- Owner paginates through the tagged rows ---
    const seen = new Set<string>();
    for (let offset = 0; offset < TOTAL; offset += PAGE) {
      const { data, error } = await ownerC
        .from("app_clients")
        .select("id, email")
        .like("email", `${TAG}-%`)
        .order("email", { ascending: true })
        .range(offset, offset + PAGE - 1);
      if (error) throw error;

      const expectedLen = Math.min(PAGE, TOTAL - offset);
      assertEquals(
        data?.length,
        expectedLen,
        `owner page @offset=${offset} must return ${expectedLen} rows`,
      );
      data!.forEach((r) => seen.add(r.id));
    }
    assertEquals(seen.size, TOTAL, "owner must see every seeded row across pages");

    // Exact count via head request also respects RLS
    const { count: ownerCount, error: ce1 } = await ownerC
      .from("app_clients")
      .select("id", { count: "exact", head: true })
      .like("email", `${TAG}-%`);
    if (ce1) throw ce1;
    assertEquals(ownerCount, TOTAL, "owner exact count must equal seeded rows");

    // --- Other user: every page must be empty ---
    for (let offset = 0; offset < TOTAL; offset += PAGE) {
      const { data, error } = await otherC
        .from("app_clients")
        .select("id")
        .like("email", `${TAG}-%`)
        .order("email", { ascending: true })
        .range(offset, offset + PAGE - 1);
      if (error) throw error;
      assertEquals(
        data?.length,
        0,
        `non-owner page @offset=${offset} must be empty`,
      );
    }

    const { count: otherCount, error: ce2 } = await otherC
      .from("app_clients")
      .select("id", { count: "exact", head: true })
      .like("email", `${TAG}-%`);
    if (ce2) throw ce2;
    assertEquals(otherCount, 0, "non-owner exact count must be zero");
  } finally {
    if (insertedIds.length) {
      await admin.from("app_clients").delete().in("id", insertedIds);
    }
    await admin.from("apps").delete().eq("id", app.id);
    await admin.auth.admin.deleteUser(owner.user!.id);
    await admin.auth.admin.deleteUser(other.user!.id);
  }
});
