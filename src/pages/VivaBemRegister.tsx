import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { syncClientSession } from "@/lib/client-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ChevronLeft, Mail, Phone, User, Calendar, Lock, KeyRound } from "lucide-react";

interface AppConfig {
  id: string;
  name: string;
  logo_url: string | null;
  background_url: string | null;
  primary_color: string;
  welcome_text: string;
}

const VivaBemRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [app, setApp] = useState<AppConfig | null>(null);
  const [appLoading, setAppLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    sex: "",
    email: "",
    birthdate: "",
    phone: "",
    password: "",
    confirm: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

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

  const validateStep1 = () => {
    if (!form.name.trim()) return "Preencha seu nome completo.";
    if (!form.sex) return "Selecione o sexo.";
    if (!form.email || !form.email.includes("@")) return "Digite um e-mail válido.";
    if (!form.birthdate) return "Informe a data de nascimento.";
    return null;
  };

  const validateStep2 = () => {
    if (form.password.length < 6) return "A senha deve ter no mínimo 6 caracteres.";
    if (form.password !== form.confirm) return "As senhas não conferem.";
    return null;
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validateStep2();
    if (msg) {
      toast({ title: msg, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const fullPhone = form.phone ? `+55${form.phone.replace(/\D/g, "")}` : "";
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            full_name: form.name.trim(),
            sex: form.sex,
            birthdate: form.birthdate,
            phone: fullPhone,
          },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      if (data.session?.user) {
        const clientId = await syncClientSession(data.session.user);
        toast({ title: `Bem-vindo ao ${app?.name || "App"}!` });
        navigate("/home");
        return;
      }

      if (data.user?.email) setEmailSentTo(data.user.email);
      else throw new Error("Não foi possível criar a conta.");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: form.email.trim().toLowerCase(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast({ title: "E-mail reenviado. Confira sua caixa de entrada." });
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

  if (emailSentTo) {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background"
        style={{
          background: app?.background_url
            ? `url(${app.background_url}) center/cover no-repeat`
            : `linear-gradient(135deg, ${accentColor}18, ${accentColor}08, hsl(var(--background)))`,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <div className="rounded-2xl bg-card p-8 shadow-card border border-border text-center">
            <div className="h-14 w-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: accentColor }}>
              <Mail className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Verifique seu e-mail</h1>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Enviamos um link de confirmação para <strong className="text-foreground">{emailSentTo}</strong>.
              Clique no link para ativar sua conta e depois faça login.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Confira também a caixa de spam/promoções. O link expira em algumas horas.
            </p>
            <Button
              onClick={resendEmail}
              disabled={loading}
              variant="outline"
              className="w-full mb-3"
            >
              {loading ? "Enviando..." : "Reenviar e-mail de verificação"}
            </Button>
            <Button
              onClick={() => navigate("/login")}
              className="w-full font-semibold text-white"
              style={{ backgroundColor: accentColor }}
            >
              Já verifiquei — fazer login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

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
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="text-center mb-6">
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {app?.name || "App"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Crie sua conta</p>
        </div>

        <div className="rounded-2xl bg-card p-8 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => (step === 2 ? setStep(1) : navigate("/login"))}
              className="p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:bg-muted"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: step === 1 ? "50%" : "100%", backgroundColor: accentColor }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-medium">{step} de 2</span>
          </div>

          {step === 1 ? (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-1">Dados</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Conte um pouco sobre você para personalizar seu painel.
              </p>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const msg = validateStep1();
                  if (msg) {
                    toast({ title: msg, variant: "destructive" });
                    return;
                  }
                  setStep(2);
                }}
              >
                <div>
                  <Label className="text-sm font-medium">Nome completo *</Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Ex.: Maria da Silva Santos"
                      className="pl-10" required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Sexo *</Label>
                  <select
                    value={form.sex}
                    onChange={(e) => set("sex", e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium">E-mail *</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="voce@exemplo.com"
                      className="pl-10" required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Data de nascimento *</Label>
                  <div className="relative mt-1.5">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="date"
                      value={form.birthdate}
                      onChange={(e) => set("birthdate", e.target.value)}
                      className="pl-10" required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">WhatsApp *</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                        +55
                      </span>
                      <Input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 11))}
                        placeholder="11 99999-9999"
                        className="rounded-l-none pl-3"
                        maxLength={11}
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold text-base py-6 rounded-xl text-white shadow-lg"
                  style={{ backgroundColor: accentColor }}
                >
                  Continuar
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-1">Métricas e acesso</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Defina sua senha de acesso ao app.
              </p>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Senha *</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="Mín. 6 caracteres"
                      className="pl-10" required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Confirmar senha *</Label>
                  <div className="relative mt-1.5">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      value={form.confirm}
                      onChange={(e) => set("confirm", e.target.value)}
                      placeholder="Repita a senha"
                      className="pl-10" required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full font-bold text-base py-6 rounded-xl text-white shadow-lg"
                  style={{ backgroundColor: accentColor }}
                >
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>
            </>
          )}

          <div className="text-center mt-6">
            <span className="text-sm text-muted-foreground">Já tem conta? </span>
            <button onClick={() => navigate("/login")} className="text-sm font-semibold" style={{ color: accentColor }}>
              Fazer login
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VivaBemRegister;