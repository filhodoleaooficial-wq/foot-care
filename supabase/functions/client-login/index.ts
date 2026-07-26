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
    const email = String(body?.email ?? "").trim().toLowerCase();
    const phone = String(body?.phone ?? "").trim();
    const userId = String(body?.userId ?? "").trim();

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "E-mail é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!phone || phone.replace(/\D/g, "").length < 8) {
      return new Response(JSON.stringify({ error: "Celular é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizePhone = (p: string) => p.replace(/\D/g, "");

    // Try to find existing client by email
    const { data: existing } = await supabase
      .from("app_clients")
      .select("id, email, phone")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    let clientId = existing?.id as string | undefined;
    let clientPhone = existing?.phone ?? phone;

    if (existing) {
      // Require phone match to prevent account takeover by email alone.
      // If existing has no phone stored, adopt the submitted one (legacy accounts).
      const storedNormalized = normalizePhone(String(existing.phone ?? ""));
      const submittedNormalized = normalizePhone(phone);
      if (storedNormalized && storedNormalized !== submittedNormalized) {
        return new Response(
          JSON.stringify({ error: "E-mail e celular não conferem. Verifique seus dados." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updates: Record<string, unknown> = {};
      if (userId) updates.user_id = userId;
      if (!storedNormalized && phone) {
        updates.phone = phone;
        clientPhone = phone;
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("app_clients").update(updates).eq("id", existing.id);
      }
    } else {
      const { data: inserted, error } = await supabase
        .from("app_clients")
        .insert({ email, phone, age: 0, gender: "", user_id: userId || null })
        .select("id")
        .single();
      if (error) throw error;
      clientId = inserted.id;
      clientPhone = phone;
    }

    return new Response(JSON.stringify({ id: clientId, email, phone: clientPhone }), {
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
