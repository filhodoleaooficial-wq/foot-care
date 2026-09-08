import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, KeyRound, Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const accentColor = "#3E8B4F";

const VivaBemResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setLoading(false);
    });
  }, []);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Digite seu e-mail.");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/recuperar-senha`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível enviar o e-mail.");
    } finally {
      setSending(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha recuperada! Faça login com a nova senha.");
      await supabase.auth.signOut();
      navigate("/login");
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível alterar a senha.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08, hsl(var(--background)))` }}
    >
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg" style={{ backgroundColor: accentColor }}>
            <KeyRound className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Recuperar senha</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {hasSession ? "Defina sua nova senha." : "Vamos enviar um link de recuperação para o seu e-mail."}
          </p>
        </div>

        <div className="rounded-2xl bg-card p-8 shadow-card border border-border">
          {hasSession ? (
            <form onSubmit={savePassword} className="space-y-5">
              <div>
                <label htmlFor="new-pass" className="text-sm font-medium block mb-1.5">Nova senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="new-pass" type="password" required minLength={6} placeholder="Mínimo 6 caracteres"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="conf-pass" className="text-sm font-medium block mb-1.5">Confirmar nova senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="conf-pass" type="password" required minLength={6} placeholder="Repita a nova senha"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    className="w-full pl-10 rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={saving}
                className="w-full font-bold text-base py-3 rounded-xl text-white disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {saving ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          ) : sent ? (
            <div className="text-center space-y-3">
              <Mail className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Enviamos um link de recuperação para <strong>{email}</strong>. Confira sua caixa de entrada (e o spam).
              </p>
              <button onClick={() => setSent(false)} className="text-sm font-semibold underline">
                Enviar novamente
              </button>
            </div>
          ) : (
            <form onSubmit={requestReset} className="space-y-5">
              <div>
                <label htmlFor="recover-email" className="text-sm font-medium block mb-1.5">E-mail cadastrado</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="recover-email" type="email" required placeholder="seu@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={sending}
                className="w-full font-bold text-base py-3 rounded-xl text-white disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                {sending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {sending ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <button onClick={() => navigate("/login")} className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: accentColor }}>
            <BookOpen className="h-4 w-4" /> Voltar para o login
          </button>
        </p>
      </div>
    </div>
  );
};

export default VivaBemResetPassword;