import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// WHO/OMS BMI classification
function classifyIMC(imc: number): string {
  if (imc < 16) return "Magreza grave";
  if (imc < 17) return "Magreza moderada";
  if (imc < 18.5) return "Magreza leve";
  if (imc < 25) return "Peso normal";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidade grau I";
  if (imc < 40) return "Obesidade grau II";
  return "Obesidade grau III (mórbida)";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const body = await req.json();
    const clientId = String(body?.clientId ?? "");
    const weight = Number(body?.weight);
    const height = Number(body?.height); // cm
    const age = body?.age ? Number(body.age) : null;
    const sex = body?.sex ? String(body.sex) : null;
    const goal = body?.goal ? String(body.goal) : null;
    const restrictions = body?.restrictions ? String(body.restrictions).slice(0, 500) : "";

    if (!clientId) throw new Error("clientId é obrigatório");
    if (!weight || weight < 20 || weight > 400) throw new Error("Peso inválido");
    if (!height || height < 80 || height > 260) throw new Error("Altura inválida");

    const heightM = height / 100;
    const imc = weight / (heightM * heightM);
    const imcRounded = Math.round(imc * 100) / 100;
    const category = classifyIMC(imcRounded);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const prompt = `Você é um nutricionista brasileiro. Gere um plano alimentar de 1 dia adequado ao perfil abaixo.

Perfil:
- IMC: ${imcRounded} (${category}) — classificação da OMS
- Peso: ${weight} kg | Altura: ${height} cm
- Idade: ${age ?? "não informada"} | Sexo: ${sex ?? "não informado"}
- Objetivo: ${goal ?? "manutenção da saúde"}
- Restrições/preferências: ${restrictions || "nenhuma"}

Instruções:
1. Comece com um breve parágrafo de orientações gerais (2-3 linhas) baseado na classificação do IMC.
2. Liste 5 refeições (Café da manhã, Lanche da manhã, Almoço, Lanche da tarde, Jantar) com opções brasileiras acessíveis, quantidades aproximadas e calorias estimadas por refeição.
3. Ao final, inclua "Dicas importantes" com 4 tópicos práticos (hidratação, atividade física, sono, quando procurar profissional).
4. Encerre com um aviso de que isto é apenas uma sugestão e não substitui acompanhamento profissional.

Formate em Markdown com títulos (##) e listas.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: [
          { role: "system", content: "Você é um nutricionista brasileiro experiente." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
      if (aiRes.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
      throw new Error(`Falha na IA (${aiRes.status}): ${errText.slice(0, 200)}`);
    }

    const aiJson = await aiRes.json();
    const mealPlan: string = aiJson?.choices?.[0]?.message?.content ?? "";
    if (!mealPlan) throw new Error("A IA não retornou um plano.");

    const { data: inserted, error: insErr } = await supabase
      .from("imc_records")
      .insert({
        client_id: clientId,
        weight_kg: weight,
        height_cm: height,
        age,
        sex,
        goal,
        imc: imcRounded,
        category,
        meal_plan: mealPlan,
      })
      .select("id, created_at")
      .single();

    if (insErr) throw insErr;

    return new Response(
      JSON.stringify({
        id: inserted.id,
        created_at: inserted.created_at,
        imc: imcRounded,
        category,
        meal_plan: mealPlan,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
