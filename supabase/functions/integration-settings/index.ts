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
    const action = String(body?.action ?? "list");

    if (action === "list") {
      const { data, error } = await supabase
        .from("integration_settings")
        .select("*")
        .order("integration_name");
      if (error) throw error;
      return new Response(JSON.stringify({ settings: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "save") {
      const integrationName = String(body?.integration_name ?? "");
      const credentials = body?.credentials ?? {};
      const isActive = Boolean(body?.is_active);

      if (!integrationName) throw new Error("integration_name is required");

      const { data, error } = await supabase
        .from("integration_settings")
        .upsert(
          {
            integration_name: integrationName,
            credentials,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "integration_name" }
        )
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ setting: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "get") {
      const integrationName = String(body?.integration_name ?? "");
      if (!integrationName) throw new Error("integration_name is required");

      const { data, error } = await supabase
        .from("integration_settings")
        .select("*")
        .eq("integration_name", integrationName)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return new Response(JSON.stringify({ setting: data ?? null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
