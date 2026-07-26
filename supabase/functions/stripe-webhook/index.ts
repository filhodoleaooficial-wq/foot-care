import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const bodyText = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    // Get webhook secret from integration_settings or env
    const { data: settings } = await supabase
      .from("integration_settings")
      .select("credentials")
      .eq("integration_name", "stripe")
      .single();

    const webhookSecret =
      settings?.credentials?.stripe_webhook_secret ||
      Deno.env.get("STRIPE_WEBHOOK_SECRET") ||
      "";

    if (!webhookSecret) {
      throw new Error("Webhook secret not configured. Add stripe_webhook_secret to integration_settings or set STRIPE_WEBHOOK_SECRET env.");
    }

    const stripeKey =
      settings?.credentials?.stripe_secret_key ||
      Deno.env.get("STRIPE_SECRET_KEY") ||
      "";

    if (!stripeKey) {
      throw new Error("Stripe secret key not configured.");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const event = stripe.webhooks.constructEvent(bodyText, signature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const productId = session.metadata?.product_id;
        const clientId = session.metadata?.client_id;

        if (session.mode === "subscription" && session.subscription && productId && clientId) {
          const subscriptionId = session.subscription as string;
          const subData = await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = subData.customer as string;
          // We don't have immediate current_period_end from the event, retrieve it
          const periodEnd = subData.current_period_end
            ? new Date(subData.current_period_end * 1000).toISOString()
            : null;

          // Upsert subscription record
          await supabase.from("subscriptions").upsert(
            {
              client_id: clientId,
              product_id: productId,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: customerId,
              status: subData.status,
              current_period_end: periodEnd,
            },
            { onConflict: "stripe_subscription_id" }
          );

          // Mark purchase as paid
          await supabase.from("product_purchases").upsert(
            {
              client_id: clientId,
              product_id: productId,
              status: "paid",
              stripe_session_id: session.id,
            },
            { onConflict: "client_id,product_id" }
          );
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        const { data: sub } = await supabase
          .from("subscriptions")
          .select("id, client_id, product_id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (sub) {
          // Retrieve the subscription to get updated period end
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = stripeSub.current_period_end
            ? new Date(stripeSub.current_period_end * 1000).toISOString()
            : null;

          await supabase
            .from("subscriptions")
            .update({
              status: stripeSub.status,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("id", sub.id);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subEvent = event.data.object as Stripe.Subscription;

        await supabase
          .from("subscriptions")
          .update({
            status: subEvent.status,
            current_period_end: subEvent.current_period_end
              ? new Date(subEvent.current_period_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subEvent.id);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
