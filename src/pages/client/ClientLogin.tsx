import { useState } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import type { AppConfig } from "./ClientAppLayout";

const ClientLogin = () => {
  const app = useOutletContext<AppConfig>();
  const { appId } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, direct access (no real client auth yet)
    navigate(`/app/${appId}/home`);
  };

  const color = app.primary_color;

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: app.background_url
          ? `url(${app.background_url}) center/cover no-repeat`
          : `linear-gradient(135deg, ${color}18, ${color}08, hsl(var(--background)))`,
      }}
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl bg-card/95 backdrop-blur-xl p-8 shadow-2xl border border-border/50"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex flex-col items-center mb-8">
          {app.logo_url ? (
            <img src={app.logo_url} alt={app.name} className="h-20 w-20 rounded-2xl object-cover mb-4 shadow-lg" />
          ) : (
            <div
              className="h-20 w-20 rounded-2xl mb-4 flex items-center justify-center shadow-lg"
              style={{ backgroundColor: color }}
            >
              <span className="text-3xl font-bold text-white">{app.name.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-2xl font-extrabold text-foreground text-center">
            {app.welcome_text}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{app.name}</p>
        </div>

        {app.login_type === "direct" ? (
          <button
            onClick={() => navigate(`/app/${appId}/home`)}
            className="w-full rounded-xl py-3.5 text-white font-bold text-base transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
            style={{ backgroundColor: color }}
          >
            Entrar no App
          </button>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-all focus:border-transparent focus:ring-2"
                style={{ "--tw-ring-color": color } as any}
                required
              />
            </div>

            {app.login_type === "complete" && (
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-11 text-sm text-foreground outline-none transition-all focus:border-transparent focus:ring-2"
                  style={{ "--tw-ring-color": color } as any}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl py-3.5 text-white font-bold text-base transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
              style={{ backgroundColor: color }}
            >
              Entrar
            </button>

            {app.login_type === "complete" && (
              <p className="text-center text-xs text-muted-foreground">
                Esqueceu a senha? <span className="cursor-pointer font-semibold" style={{ color }}>Recuperar</span>
              </p>
            )}
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ClientLogin;
