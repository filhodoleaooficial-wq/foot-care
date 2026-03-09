import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Smartphone, Palette, Zap, Shield, BarChart3, Globe, Check } from "lucide-react";
import logoImg from "@/assets/logo-pesaude.png";
import heroImg from "@/assets/hero-image.jpg";
import { useState } from "react";

const features = [
  { icon: Smartphone, title: "Mobile-First", desc: "Apps otimizados para celular, instaláveis como PWA." },
  { icon: Palette, title: "100% Personalizável", desc: "Cores, logo, fontes e layout totalmente customizáveis." },
  { icon: Zap, title: "Rápido de Criar", desc: "6 etapas simples e seu app está no ar." },
  { icon: Shield, title: "Seguro", desc: "Autenticação e dados protegidos com criptografia." },
  { icon: BarChart3, title: "Gestão Completa", desc: "Controle produtos, módulos e clientes num só lugar." },
  { icon: Globe, title: "Multi-idioma", desc: "Português, Inglês e Espanhol disponíveis." },
];

const planFeatures = [
  "3 aplicativos",
  "Até 500 clientes",
  "Suporte prioritário",
  "Personalização visual completa",
  "Integrações de pagamento",
  "Banners personalizados",
  "Multi-idioma",
];

const LandingPage = () => {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="PéSaúde Builder" className="h-8 w-8" />
            <span className="text-xl font-extrabold text-foreground">PéSaúde <span className="text-gradient">Builder</span></span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Planos</a>
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/login?signup=true">
              <Button variant="hero" size="sm">Começar Agora</Button>
            </Link>
          </div>
          <Link to="/login?signup=true" className="md:hidden">
            <Button variant="hero" size="sm">Começar</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-background to-background" />
        <div className="container relative mx-auto grid items-center gap-12 px-4 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-accent-foreground mb-6">
              🦶 Plataforma #1 para Profissionais de Saúde dos Pés
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Crie seu app de <span className="text-gradient">cuidados com os pés</span> em minutos
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Monte um aplicativo personalizado para seus clientes com conteúdos, vídeos, PDFs e muito mais. Sem código, sem complicação.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/login?signup=true">
                <Button variant="hero" size="lg" className="text-base px-8">
                  Assinar Plano Pro
                </Button>
              </Link>
              <a href="#features">
                <Button variant="hero-outline" size="lg" className="text-base px-8">
                  Ver Recursos
                </Button>
              </a>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex justify-center"
          >
            <div className="relative w-64 rounded-[2.5rem] border-[8px] border-foreground/10 bg-foreground/5 p-2 shadow-card sm:w-72">
              <div className="overflow-hidden rounded-[2rem]">
                <img src={heroImg} alt="Preview do app" className="w-full object-cover aspect-[9/16]" />
              </div>
              <div className="absolute left-1/2 top-2 h-6 w-20 -translate-x-1/2 rounded-full bg-foreground/10" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">Tudo que você precisa</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Ferramentas poderosas para criar, personalizar e publicar seu app profissional.
            </p>
          </motion.div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group rounded-xl border bg-card p-6 shadow-card transition-all hover:shadow-card-hover"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Single Pro Plan */}
      <section id="pricing" className="py-20 lg:py-28 bg-secondary/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">Plano Pro</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Tudo que você precisa para criar e gerenciar seus apps profissionais.
            </p>
          </motion.div>

          {/* Billing toggle */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${billingPeriod === "monthly" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${billingPeriod === "yearly" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              Anual
              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">Economize 30%</span>
            </button>
          </div>

          <motion.div
            className="mx-auto mt-12 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative rounded-2xl border-primary ring-2 ring-primary/20 bg-card p-8 shadow-card">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary rounded-full px-4 py-1 text-xs font-bold text-primary-foreground">
                Plano Pro
              </span>
              <div className="mt-4 text-center">
                <span className="text-5xl font-extrabold text-foreground">
                  {billingPeriod === "monthly" ? "R$ 97,90" : "R$ 67,90"}
                </span>
                <span className="text-muted-foreground">
                  {billingPeriod === "monthly" ? "/mês" : "/mês (cobrado anualmente)"}
                </span>
              </div>
              <ul className="mt-8 space-y-3">
                {planFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/login?signup=true" className="block mt-8">
                <Button variant="hero" className="w-full" size="lg">
                  Assinar Agora
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto flex flex-col items-center gap-4 px-4 text-center">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="PéSaúde" className="h-6 w-6" />
            <span className="font-bold text-foreground">PéSaúde Builder</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 PéSaúde Builder. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
