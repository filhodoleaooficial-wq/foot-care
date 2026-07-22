import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function getWhatsAppConfig(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase
    .from("integration_settings")
    .select("credentials, is_active")
    .eq("integration_name", "whatsapp")
    .single();

  if (data?.is_active && data.credentials) {
    return {
      apiUrl: data.credentials.evolution_api_url || "",
      apiKey: data.credentials.evolution_api_key || "",
      instanceName: data.credentials.evolution_instance_name || "",
    };
  }

  return {
    apiUrl: Deno.env.get("EVOLUTION_API_URL") || "",
    apiKey: Deno.env.get("EVOLUTION_API_KEY") || "",
    instanceName: Deno.env.get("EVOLUTION_INSTANCE_NAME") || "",
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Require authenticated admin (app owner) before sending WhatsApp messages
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    const { data: ownedApp } = await supabase
      .from("apps")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!ownedApp) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = await getWhatsAppConfig(supabase);
    if (!config.apiUrl) throw new Error('EVOLUTION_API_URL is not configured. Acesse Integrações no painel para configurar.');
    if (!config.apiKey) throw new Error('EVOLUTION_API_KEY is not configured. Acesse Integrações no painel para configurar.');
    if (!config.instanceName) throw new Error('EVOLUTION_INSTANCE_NAME is not configured. Acesse Integrações no painel para configurar.');

    const { action, number, text } = await req.json();

    const baseUrl = config.apiUrl.replace(/\/+$/, '');

    if (action === 'send-text') {
      if (!number || !text) {
        return new Response(JSON.stringify({ error: 'number and text are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const cleanNumber = number.replace(/[\s\-\+\(\)]/g, '');

      const response = await fetch(
        `${baseUrl}/message/sendText/${config.instanceName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.apiKey,
          },
          body: JSON.stringify({
            number: cleanNumber,
            text,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Evolution API error [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'check-connection') {
      const response = await fetch(
        `${baseUrl}/instance/connectionState/${config.instanceName}`,
        {
          method: 'GET',
          headers: { 'apikey': config.apiKey },
        }
      );

      const data = await response.json();
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('WhatsApp function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
