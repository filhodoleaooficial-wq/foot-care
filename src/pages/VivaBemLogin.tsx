import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const VivaBemLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"feminino" | "masculino">("feminino");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !age) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Check if client already exists
      const { data: existing } = await supabase
        .from("app_clients")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        // Existing client — just login
        localStorage.setItem("vivabem_client_id", existing.id);
        localStorage.setItem("vivabem_email", email);
      } else {
        // New client — insert
        const { data, error } = await supabase
          .from("app_clients")
          .insert({ email, age: parseInt(age), gender })
          .select("id")
          .single();

        if (error) throw error;
        localStorage.setItem("vivabem_client_id", data.id);
        localStorage.setItem("vivabem_email", email);
      }

      toast({ title: "Bem-vinda ao VivaBem! 💚" });
      navigate("/home");
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
            <Heart className="h-10 w-10 text-primary fill-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            viva<span className="text-gradient">bem</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground tracking-[0.2em] uppercase">
            Emagrecimento para mulheres
          </p>
          <p className="text-xs text-muted-foreground mt-1 tracking-widest">
            BEM-ESTAR, FITNESS e SAÚDE
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-card p-8 shadow-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6 text-center">
            Acesse sua conta
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-primary-foreground font-bold text-base py-6 rounded-xl shadow-glow"
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
