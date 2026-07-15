import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_PRICE_CENTS = 2790; // R$ 27,90

async function getStripeKey(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data } = await supabase
    .from("integration_settings")
    .select("credentials, is_active")
    .eq("integration_name", "stripe")
    .single();

  if (data?.is_active && data.credentials?.stripe_secret_key) {
    return data.credentials.stripe_secret_key;
  }

  const envKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (envKey) return envKey;

  throw new Error("Chave secreta do Stripe não configurada. Acesse Integrações no painel para configurar.");
}

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
    const stripeKey = await getStripeKey(supabase);

    const body = await req.json();
    const productId = String(body?.productId ?? "");
    const clientId = String(body?.clientId ?? "");
    if (!productId || !clientId) throw new Error("productId and clientId are required");

    const { data: product, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price")
      .eq("id", productId)
      .single();
    if (prodErr || !product) throw new Error("Produto não encontrado");

    const { data: client } = await supabase
      .from("app_clients")
      .select("id, email")
      .eq("id", clientId)
      .single();

    const amountCents = product.price ? Math.round(Number(product.price) * 100) : DEFAULT_PRICE_CENTS;

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "";

    const session = await stripe.checkout.sessions.create({
      customer_email: client?.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: product.name },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-canceled`,
      metadata: { product_id: productId, client_id: clientId },
    });

    await supabase.from("product_purchases").upsert(
      {
        client_id: clientId,
        product_id: productId,
        status: "pending",
        amount: amountCents / 100,
        stripe_session_id: session.id,
      },
      { onConflict: "client_id,product_id" }
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
