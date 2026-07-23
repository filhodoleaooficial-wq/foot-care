import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getClientSession } from "@/lib/client-session";

interface Result {
  loading: boolean;
  isPremium: boolean;
}

export function usePremiumGate(): Result {
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const check = async () => {
      const session = getClientSession();
      if (!session?.id) {
        setIsPremium(false);
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase.functions.invoke("list-purchases", {
          body: { clientId: session.id },
        });
        const purchases = (data as any)?.purchases || [];
        setIsPremium(Array.isArray(purchases) && purchases.length > 0);
      } catch {
        setIsPremium(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  return { loading, isPremium };
}
