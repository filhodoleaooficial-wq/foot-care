import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "paid" | "pending">("loading");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setStatus("pending");
      return;
    }
    supabase.functions
      .invoke("verify-purchase", { body: { sessionId } })
      .then(({ data }) => {
        setStatus(data?.paid ? "paid" : "pending");
      })
      .catch(() => setStatus("pending"));
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-lg"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="mx-auto mb-6 h-12 w-12 animate-spin text-primary" />
            <h1 className="mb-2 text-2xl font-bold text-foreground">Confirmando pagamento...</h1>
            <p className="text-muted-foreground">Aguarde um instante.</p>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
            >
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </motion.div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              {status === "paid" ? "Pagamento confirmado!" : "Recebemos seu acesso"}
            </h1>
            <p className="mb-6 text-muted-foreground">
              {status === "paid"
                ? "Seu curso foi liberado com sucesso. Aproveite!"
                : "Assim que o pagamento for confirmado, o curso será liberado no app."}
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link to="/home">Ir para o app</Link>
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
