import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Smartphone, Palette, Zap, Shield, BarChart3, Globe, Check } from "lucide-react";
import logoImg from "@/assets/logo-pesaude.png";
import heroImg from "@/assets/hero-image.jpg";

const features = [
  { icon: Smartphone, title: "Mobile-First", desc: "Apps otimizados para celular, instaláveis como PWA." },
  { icon: Palette, title: "100% Personalizável", desc: "Cores, logo, fontes e layout totalmente customizáveis." },
  { icon: Zap, title: "Rápido de Criar", desc: "6 etapas simples e seu app está no ar." },
  { icon: Shield, title: "Seguro", desc: "Autenticação e dados protegidos com criptografia." },
  { icon: BarChart3, title: "Gestão Completa", desc: "Controle produtos, módulos e clientes num só lugar." },
  { icon: Globe, title: "Multi-idioma", desc: "Português, Inglês e Espanhol disponíveis." },
];

const plans = [
  { name: "Básico", price: "R$ 47", period: "/mês", apps: "1 App", features: ["1 aplicativo", "Até 100 clientes", "Suporte por e-mail", "Personalização visual completa"] },
  { name: "Pro", price: "R$ 97", period: "/mês", apps: "3 Apps", popular: true, features: ["3 aplicativos", "Até 500 clientes", "Suporte prioritário", "Integrações de pagamento", "Banners personalizados"] },
  { name: "Scale", price: "R$ 197", period: "/mês", apps: "5 Apps", features: ["5 aplicativos", "Clientes ilimitados", "Suporte VIP", "Todas as integrações", "Webhooks avançados", "Multi-idioma"] },
];

const LandingPage = () => {
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
                  Começar Gratuitamente
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

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-28 bg-secondary/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">Planos & Preços</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Escolha o plano ideal para o tamanho do seu negócio.
            </p>
          </motion.div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`relative rounded-2xl border bg-card p-8 shadow-card ${plan.popular ? "border-primary ring-2 ring-primary/20" : ""}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary rounded-full px-4 py-1 text-xs font-bold text-primary-foreground">
                    Mais Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.apps}</p>
                <div className="mt-6">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login?signup=true" className="block mt-8">
                  <Button variant={plan.popular ? "hero" : "outline"} className="w-full">
                    Escolher {plan.name}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
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
