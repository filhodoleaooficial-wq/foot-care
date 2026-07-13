import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";
import { setClientSession } from "@/lib/client-session";

interface AppConfig {
  id: string;
  name: string;
  logo_url: string | null;
  background_url: string | null;
  primary_color: string;
  welcome_text: string;
}

const VivaBemLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [app, setApp] = useState<AppConfig | null>(null);
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const fetchApp = async () => {
      const { data } = await supabase
        .from("apps")
        .select("id, name, logo_url, background_url, primary_color, welcome_text")
        .eq("status", "published")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
      if (data) setApp(data);
      setAppLoading(false);
    };
    fetchApp();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phone) {
      toast({ title: "Preencha e-mail e celular", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("client-login", {
        body: { email, phone },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.id) throw new Error("Não foi possível registrar o acesso.");

      setClientSession({ id: data.id, email, phone });
      toast({ title: `Bem-vindo ao ${app?.name || "App"}! 🎉` });
      navigate("/home");
    } catch (err: any) {
      toast({ title: "Erro ao entrar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (appLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const accentColor = app?.primary_color || "#3E8B4F";

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: app?.background_url
          ? `url(${app.background_url}) center/cover no-repeat`
          : `linear-gradient(135deg, ${accentColor}18, ${accentColor}08, hsl(var(--background)))`,
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-[-80px] right-[-60px] w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: `${accentColor}30` }} />
      <div className="absolute bottom-[-100px] left-[-80px] w-80 h-80 rounded-full bg-accent blur-3xl" />
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full blur-2xl" style={{ backgroundColor: `${accentColor}15` }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo / branding */}
        <div className="text-center mb-8">
          {app?.logo_url ? (
            <img src={app.logo_url} alt={app.name} className="h-16 w-16 rounded-2xl object-cover mx-auto mb-3 shadow-lg" />
          ) : (
            <div
              className="h-16 w-16 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          )}
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            {app?.name || "App"}
          </h1>
          {app?.welcome_text && (
            <p className="mt-2 text-sm text-muted-foreground">{app.welcome_text}</p>
          )}
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-card p-8 shadow-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6 text-center">
            Acesse o app
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
              <Input
                id="email" type="email" placeholder="seu@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5" required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium">Celular</Label>
              <Input
                id="phone" type="tel" placeholder="(11) 99999-9999"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5" required
              />
            </div>

            <Button
              type="submit" disabled={loading}
              className="w-full font-bold text-base py-6 rounded-xl text-white shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </motion.div>
    </div>
  );
};

export default VivaBemLogin;
