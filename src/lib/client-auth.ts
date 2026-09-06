import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { setClientSession } from "@/lib/client-session";

export async function syncClientSession(user: User): Promise<string> {
  const email = user.email || "";
  const phone = String(user.user_metadata?.phone || "");

  const { data, error } = await supabase.functions.invoke("client-login", {
    body: { email, phone, userId: user.id },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.id) throw new Error("Falha ao vincular acesso.");

  setClientSession({
    id: data.id,
    email: data.email || email,
    phone: data.phone || phone,
  });
  return data.id;
}