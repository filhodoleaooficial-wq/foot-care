import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const PaymentSuccess = () => {
  const { checkSubscription } = useAuth();

  useEffect(() => {
    // Refresh subscription status after Stripe redirect
    checkSubscription?.();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
        >
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </motion.div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Pagamento confirmado!
        </h1>
        <p className="mb-6 text-muted-foreground">
          Sua assinatura foi ativada com sucesso. Bem-vindo ao Premium!
        </p>
        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link to="/home">Ir para o app</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/admin/dashboard">Ir para o painel</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
