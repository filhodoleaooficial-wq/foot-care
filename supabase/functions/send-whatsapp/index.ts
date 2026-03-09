import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
    if (!EVOLUTION_API_URL) throw new Error('EVOLUTION_API_URL is not configured');

    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
    if (!EVOLUTION_API_KEY) throw new Error('EVOLUTION_API_KEY is not configured');

    const EVOLUTION_INSTANCE_NAME = Deno.env.get('EVOLUTION_INSTANCE_NAME');
    if (!EVOLUTION_INSTANCE_NAME) throw new Error('EVOLUTION_INSTANCE_NAME is not configured');

    const { action, number, text } = await req.json();

    // Normalize base URL (remove trailing slash)
    const baseUrl = EVOLUTION_API_URL.replace(/\/+$/, '');

    if (action === 'send-text') {
      if (!number || !text) {
        return new Response(JSON.stringify({ error: 'number and text are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Clean phone number (remove +, spaces, dashes)
      const cleanNumber = number.replace(/[\s\-\+\(\)]/g, '');

      const response = await fetch(
        `${baseUrl}/message/sendText/${EVOLUTION_INSTANCE_NAME}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
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
        `${baseUrl}/instance/connectionState/${EVOLUTION_INSTANCE_NAME}`,
        {
          method: 'GET',
          headers: { 'apikey': EVOLUTION_API_KEY },
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
