import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { syncClientSession } from "@/lib/client-auth";
import { setClientSession } from "@/lib/client-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Lock, Mail, Phone, UserPlus } from "lucide-react";

interface AppConfig {
  id: string;
  name: string;
  logo_url: string | null;
  background_url: string | null;
  primary_color: string;
  welcome_text: string;
}

type Mode = "password" | "simple";

const VivaBemLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Digite seu e-mail", variant: "destructive" });
      return;
    }
    if (!password) {
      toast({ title: "Digite sua senha", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error("Login não realizado.");
      await syncClientSession(data.user);
      toast({ title: `Bem-vindo ao ${app?.name || "App"}!` });
      navigate("/home");
    } catch (err: any) {
      toast({
        title: "Erro",
        description:
          err?.message?.toLowerCase().includes("invalid login credentials")
            ? "E-mail ou senha incorretos. Verifique seus dados ou crie uma conta."
            : err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSimpleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Digite seu e-mail", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const fullPhone = phone ? `+55${phone.replace(/\D/g, "")}` : "";
      const { data: clientData, error: clientError } = await supabase.functions.invoke("client-login", {
        body: { email: email.trim().toLowerCase(), phone: fullPhone },
      });
      if (clientError) throw clientError;
      if (clientData?.error) throw new Error(clientData.error);
      if (!clientData?.id) throw new Error("Falha ao registrar acesso.");

      setClientSession({
        id: clientData.id,
        email: email.trim().toLowerCase(),
        phone: fullPhone,
      });
      toast({ title: `Bem-vindo ao ${app?.name || "App"}!` });
      navigate("/home");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
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
      <div className="absolute top-[-80px] right-[-60px] w-40 sm:w-64 h-40 sm:h-64 rounded-full blur-3xl" style={{ backgroundColor: `${accentColor}30` }} />
      <div className="absolute bottom-[-100px] left-[-80px] w-48 sm:w-80 h-48 sm:h-80 rounded-full bg-accent blur-3xl" />
      <div className="absolute top-20 left-10 w-20 sm:w-32 h-20 sm:h-32 rounded-full blur-2xl" style={{ backgroundColor: `${accentColor}15` }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
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
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            {app?.name || "App"}
          </h1>
          {app?.welcome_text && (
            <p className="mt-2 text-sm text-muted-foreground">{app.welcome_text}</p>
          )}
        </div>

        <div className="rounded-2xl bg-card p-8 shadow-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6 text-center">
            Acesse o app
          </h2>

          <div className="flex rounded-xl bg-muted p-1 mb-6">
            <button
              onClick={() => setMode("password")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === "password" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              E-mail + senha
            </button>
            <button
              onClick={() => setMode("simple")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === "simple" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              E-mail simples
            </button>
          </div>

          {mode === "password" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email" type="email" placeholder="seu@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-10" required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password" type="password" placeholder="Sua senha"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-10" required
                  />
                </div>
              </div>
              <Button
                type="submit" disabled={loading}
                className="w-full font-bold text-base py-6 rounded-xl text-white shadow-lg"
                style={{ backgroundColor: accentColor }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate("/recuperar-senha")}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSimpleLogin} className="space-y-5">
              <div>
                <Label htmlFor="email-simple" className="text-sm font-medium">E-mail</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email-simple" type="email" placeholder="seu@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-10" required
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                  Quer receber Bônus, Dicas e Novidades? informe o celular
                </p>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                      +55
                    </span>
                    <Input
                      id="phone" type="tel" placeholder="11 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      className="rounded-l-none pl-3"
                      maxLength={11}
                    />
                  </div>
                </div>
              </div>
              <Button
                type="submit" disabled={loading}
                className="w-full font-bold text-base py-6 rounded-xl text-white shadow-lg"
                style={{ backgroundColor: accentColor }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-border text-center">
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: accentColor }}
            >
              <UserPlus className="h-4 w-4" />
              Criar conta
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </motion.div>
    </div>
  );
};

export default VivaBemLogin;