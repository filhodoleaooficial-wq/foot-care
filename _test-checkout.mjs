import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const URL = "https://ygimcsqxykbyrtnpygss.supabase.co";
const key = fs.readFileSync(".env", "utf8")
  .split("\n")
  .find((l) => l.startsWith("VITE_SUPABASE_PUBLISHABLE_KEY"))
  .split("=")[1]
  .trim();

const email = `teste_${Date.now()}@example.com`;
const password = "Teste@12345";

const supabase = createClient(URL, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.auth.signUp({ email, password });
console.log("SIGNUP:", error ? `ERRO: ${error.message}` : `OK user=${data.user?.id}`);

if (data?.session?.access_token) {
  const token = data.session.access_token;
  const res = await fetch(`${URL}/functions/v1/create-checkout`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId: "00000000-0000-0000-0000-000000000000",
      clientId: "00000000-0000-0000-0000-000000000000",
      baseUrl: "https://example.com",
    }),
  });
  console.log("FUNCTION STATUS:", res.status);
  const text = await res.text();
  console.log("FUNCTION BODY:", text);
}