import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json();
    const clientId = String(body?.clientId ?? "");
    const email = String(body?.email ?? "").trim().toLowerCase();
    const userId = String(body?.userId ?? "");
    const productId = body?.productId ? String(body.productId) : null;
    if (!clientId && !email && !userId) throw new Error("clientId is required");

    // Resolve every app_clients.id linked to this person:
    // - the stored client id (legacy localStorage session)
    // - any client with the same e-mail (covers duplicate records)
    // - any client with the same auth user id (covers purchases made under other records)
    const candidates = new Set<string>();
    if (clientId) candidates.add(clientId);

    if (email || userId) {
      let filter = "";
      if (email && userId) filter = `email.eq.${email},user_id.eq.${userId}`;
      else if (email) filter = `email.eq.${email}`;
      else filter = `user_id.eq.${userId}`;

      const emailOrUserRes = await supabase
        .from("app_clients")
        .select("id")
        .or(filter)
        .limit(50);
      if (emailOrUserRes.error) throw emailOrUserRes.error;
      for (const row of emailOrUserRes.data ?? []) candidates.add(row.id);
    }

    const ids = Array.from(candidates);
    if (ids.length === 0) throw new Error("Nenhum cliente encontrado");

    // One-time purchases paid
    let purchQuery = supabase
      .from("product_purchases")
      .select("product_id")
      .in("client_id", ids)
      .eq("status", "paid");
    if (productId) purchQuery = purchQuery.eq("product_id", productId);

    // Active/trialing subscriptions
    let subQuery = supabase
      .from("subscriptions")
      .select("product_id")
      .in("client_id", ids)
      .in("status", ["active", "trialing"]);
    if (productId) subQuery = subQuery.eq("product_id", productId);

    const [purchRes, subRes] = await Promise.all([purchQuery, subQuery]);
    if (purchRes.error) throw purchRes.error;
    if (subRes.error) throw subRes.error;

    const productIds = Array.from(
      new Set([
        ...(purchRes.data ?? []).map((r: any) => r.product_id),
        ...(subRes.data ?? []).map((r: any) => r.product_id),
      ])
    );

    return new Response(JSON.stringify({ productIds }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg, productIds: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});