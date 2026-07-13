import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODULE_PRICE_CENTS = 2790; // R$ 27,90

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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const body = await req.json();
    const moduleId = String(body?.moduleId ?? "");
    const clientId = String(body?.clientId ?? "");
    if (!moduleId || !clientId) throw new Error("moduleId and clientId are required");

    // Load module + client for metadata and label
    const { data: mod, error: modErr } = await supabase
      .from("modules")
      .select("id, title")
      .eq("id", moduleId)
      .single();
    if (modErr || !mod) throw new Error("Módulo não encontrado");

    const { data: client } = await supabase
      .from("app_clients")
      .select("id, email")
      .eq("id", clientId)
      .single();

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const origin = req.headers.get("origin") || "";
    const session = await stripe.checkout.sessions.create({
      customer_email: client?.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: mod.title },
            unit_amount: MODULE_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-canceled`,
      metadata: { module_id: moduleId, client_id: clientId },
    });

    // Record a pending purchase
    await supabase.from("module_purchases").upsert(
      {
        client_id: clientId,
        module_id: moduleId,
        status: "pending",
        amount: MODULE_PRICE_CENTS / 100,
        stripe_session_id: session.id,
      },
      { onConflict: "client_id,module_id" }
    );

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
