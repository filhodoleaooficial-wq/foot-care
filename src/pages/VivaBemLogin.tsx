import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Footprints } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const VivaBemLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"feminino" | "masculino">("feminino");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !age)) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (authError) throw authError;

        // Create app_clients record linked to auth user
        if (authData.user) {
          const { error: clientError } = await supabase
            .from("app_clients")
            .insert({
              email,
              age: parseInt(age),
              gender,
              user_id: authData.user.id,
            });
          if (clientError) throw clientError;
        }

        toast({ title: "Conta criada! Bem-vindo ao PéSaúde! 🦶" });
        navigate("/home");
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        toast({ title: "Bem-vindo ao PéSaúde! 🦶" });
        navigate("/home");
      }
    } catch (err: any) {
      toast({ title: "Erro ao entrar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-80px] right-[-60px] w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-[-100px] left-[-80px] w-80 h-80 rounded-full bg-accent blur-3xl" />
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <Footprints className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Pé<span className="text-gradient">Saúde</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground tracking-[0.2em] uppercase">
            Saúde dos Pés
          </p>
          <p className="text-xs text-muted-foreground mt-1 tracking-widest">
            CUIDADOS, EXERCÍCIOS e BEM-ESTAR
          </p>
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
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
                minLength={6}
                required
              />
            </div>

            {isSignUp && (
              <>
                <div>
                  <Label htmlFor="age" className="text-sm font-medium">Idade</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    min={10}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="mt-1.5"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Sexo</Label>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setGender("feminino")}
                      className={`rounded-xl py-3 text-sm font-semibold border-2 transition-all ${
                        gender === "feminino"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      Feminino
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender("masculino")}
                      className={`rounded-xl py-3 text-sm font-semibold border-2 transition-all ${
                        gender === "masculino"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      Masculino
                    </button>
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-primary-foreground font-bold text-base py-6 rounded-xl shadow-glow"
            >
              {loading ? "Entrando..." : isSignUp ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp ? "Já tenho conta — Entrar" : "Não tenho conta — Criar"}
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
