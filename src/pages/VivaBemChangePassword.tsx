import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Lock, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppConfig } from "@/contexts/AppConfigContext";
import { toast } from "sonner";

const VivaBemChangePassword = () => {
  const navigate = useNavigate();
  const { app } = useAppConfig();
  const accent = app?.primary_color || "hsl(var(--vivabem-green))";
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user);
      setLoading(false);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
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
      toast.success("Senha alterada com sucesso!");
      setPassword("");
      setConfirm("");
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível alterar a senha.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <KeyRound className="h-7 w-7" style={{ color: accent }} />
        <h1 className="text-3xl font-bold text-foreground">Alterar senha</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Defina uma nova senha para o seu acesso com e-mail + senha.
      </p>

      {!hasSession ? (
        <div className="rounded-xl border bg-card p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Para trocar a senha, entre com a conta de <strong>e-mail + senha</strong> primeiro.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold"
            style={{ backgroundColor: accent }}
          >
            <LogIn className="h-4 w-4" /> Fazer login
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-xl border bg-card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Nova senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password" required minLength={6} placeholder="Mínimo 6 caracteres"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Confirmar nova senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password" required minLength={6} placeholder="Repita a nova senha"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="w-full pl-10 rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <button
            type="submit" disabled={saving}
            className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {saving ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      )}
    </div>
  );
};

export default VivaBemChangePassword;