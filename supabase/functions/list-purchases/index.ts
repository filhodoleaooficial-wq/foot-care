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
    const productId = body?.productId ? String(body.productId) : null;
    if (!clientId) throw new Error("clientId is required");

    let query = supabase
      .from("product_purchases")
      .select("product_id")
      .eq("client_id", clientId)
      .eq("status", "paid");
    if (productId) query = query.eq("product_id", productId);

    const { data, error } = await query;
    if (error) throw error;

    const productIds = (data ?? []).map((r: any) => r.product_id);
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
