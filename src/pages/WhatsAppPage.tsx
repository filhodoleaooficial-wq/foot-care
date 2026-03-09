import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, Send, MessageSquare, Phone, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const WhatsAppPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [number, setNumber] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(false);

  const checkConnection = async () => {
    setCheckingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { action: "check-connection" },
      });
      if (error) throw error;
      const state = data?.data?.instance?.state || data?.data?.state || "unknown";
      setConnectionStatus(state);
      toast({
        title: state === "open" ? "Conectado!" : "Status: " + state,
        description: state === "open" ? "WhatsApp está conectado e pronto." : "Verifique sua instância na Evolution API.",
      });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      setConnectionStatus("error");
    } finally {
      setCheckingConnection(false);
    }
  };

  const sendMessage = async () => {
    if (!number.trim() || !text.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { action: "send-text", number: number.trim(), text: text.trim() },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro desconhecido");
      toast({ title: "Mensagem enviada!", description: `Para: ${number}` });
      setText("");
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <h1 className="text-lg font-extrabold text-foreground">WhatsApp</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={checkConnection}
            disabled={checkingConnection}
          >
            {connectionStatus === "open" ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            {checkingConnection ? "Verificando..." : "Status"}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <motion.div
          className="rounded-xl border bg-card p-6 shadow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Enviar Mensagem
          </h2>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone">Número do WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="5531999999999"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Formato: código do país + DDD + número (sem espaços ou traços)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={5}
              />
            </div>

            <Button
              variant="hero"
              className="w-full gap-2"
              onClick={sendMessage}
              disabled={sending || !number.trim() || !text.trim()}
            >
              <Send className="h-4 w-4" />
              {sending ? "Enviando..." : "Enviar Mensagem"}
            </Button>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          className="mt-6 rounded-xl border bg-card p-6 shadow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-bold text-foreground mb-3">💡 Dicas</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use o botão <strong>Status</strong> para verificar se a conexão com o WhatsApp está ativa.</li>
            <li>• O número deve incluir o código do país (ex: <code className="bg-muted px-1 rounded">55</code> para Brasil).</li>
            <li>• Não inclua o <code className="bg-muted px-1 rounded">+</code> no início do número.</li>
          </ul>
        </motion.div>
      </main>
    </div>
  );
};

export default WhatsAppPage;
