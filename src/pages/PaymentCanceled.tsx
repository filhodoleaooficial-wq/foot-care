import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentCanceled = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-lg"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
          <XCircle className="h-12 w-12 text-orange-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Pagamento não concluído
        </h1>
        <p className="mb-6 text-muted-foreground">
          Você cancelou o checkout ou ocorreu um problema. Nenhuma cobrança foi
          realizada — você pode tentar novamente quando quiser.
        </p>
        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link to="/home">Tentar novamente</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentCanceled;
