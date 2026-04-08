import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";

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
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"feminino" | "masculino">("feminino");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
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
    if (!email || !password || (isSignUp && !age)) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (authError) throw authError;

        if (authData.user) {
          const { error: clientError } = await supabase
            .from("app_clients")
            .insert({ email, age: parseInt(age), gender, user_id: authData.user.id });
          if (clientError) throw clientError;
        }

        toast({ title: `Conta criada! Bem-vindo ao ${app?.name || "App"}! 🎉` });
        navigate("/home");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: `Bem-vindo ao ${app?.name || "App"}! 🎉` });
        navigate("/home");
      }
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
            {isSignUp ? "Crie sua conta" : "Acesse sua conta"}
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
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <Input
                id="password" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5" minLength={6} required
              />
            </div>

            {isSignUp && (
              <>
                <div>
                  <Label htmlFor="age" className="text-sm font-medium">Idade</Label>
                  <Input
                    id="age" type="number" placeholder="25" min={10} max={100}
                    value={age} onChange={(e) => setAge(e.target.value)}
                    className="mt-1.5" required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Sexo</Label>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    {(["feminino", "masculino"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`rounded-xl py-3 text-sm font-semibold border-2 transition-all ${
                          gender === g
                            ? "bg-opacity-10"
                            : "border-border bg-card text-muted-foreground hover:border-opacity-40"
                        }`}
                        style={gender === g ? { borderColor: accentColor, color: accentColor, backgroundColor: `${accentColor}15` } : undefined}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit" disabled={loading}
              className="w-full font-bold text-base py-6 rounded-xl text-white shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              {loading ? "Entrando..." : isSignUp ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm hover:underline"
              style={{ color: accentColor }}
            >
              {isSignUp ? "Já tenho conta — Entrar" : "Não tenho conta — Criar"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
        <p className="text-center mt-3">
          <Link to="/quiz" className="text-xs hover:underline font-medium" style={{ color: accentColor }}>
            🦶 Ainda não conhece? Faça nosso quiz de saúde dos pés
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default VivaBemLogin;
