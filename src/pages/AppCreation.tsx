import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Upload, Palette, Home, Settings, Package, Layers, Plug, Rocket } from "lucide-react";
import logoImg from "@/assets/logo-pesaude.png";

const steps = [
  { icon: Palette, label: "Visual Login" },
  { icon: Home, label: "Visual Home" },
  { icon: Settings, label: "Dados Gerais" },
  { icon: Package, label: "Produtos" },
  { icon: Layers, label: "Módulos" },
  { icon: Plug, label: "Integrações" },
];

const AppCreation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [appName, setAppName] = useState("");
  const [welcomeText, setWelcomeText] = useState("Seja Bem-Vindo!");
  const [primaryColor, setPrimaryColor] = useState("#FF4B8B");
  const [loginType, setLoginType] = useState("complete");
  const [visualStyle, setVisualStyle] = useState("original");
  const [showProgress, setShowProgress] = useState(true);
  const [description, setDescription] = useState("");

  const colors = ["#FF4B8B", "#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#1A1A1A"];

  const next = () => setCurrentStep((s) => Math.min(s + 1, 5));
  const prev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="PéSaúde" className="h-6 w-6" />
            <span className="font-bold text-foreground">Criar App</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Stepper */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 overflow-x-auto">
          <div className="flex items-center justify-center gap-1 sm:gap-2 min-w-max mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(i)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:py-2 sm:text-sm ${
                    i === currentStep
                      ? "gradient-primary text-primary-foreground shadow-glow"
                      : i < currentStep
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < currentStep ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <step.icon className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`mx-1 h-0.5 w-4 sm:w-8 ${i < currentStep ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Form panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border bg-card p-6 sm:p-8 shadow-card"
            >
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground">Personalização Visual — Tela de Login</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Configure a aparência da tela de login do seu app.</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Logo do App</Label>
                    <div className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-accent/30 transition-colors hover:border-primary/60">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Mensagem de Boas-vindas</Label>
                    <Input value={welcomeText} onChange={(e) => setWelcomeText(e.target.value)} placeholder="Seja Bem-Vindo!" />
                  </div>

                  <div className="space-y-2">
                    <Label>Cor Principal</Label>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((c) => (
                        <button
                          key={c}
                          onClick={() => setPrimaryColor(c)}
                          className={`h-9 w-9 rounded-full border-2 transition-all ${
                            primaryColor === c ? "border-foreground scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Plano de Fundo</Label>
                    <div className="flex h-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-accent/30 transition-colors hover:border-primary/60">
                      <div className="text-center">
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">Upload imagem</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground">Personalização — Tela Home</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Defina o estilo da tela principal do app.</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Estilo Visual</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {["original", "netflix"].map((style) => (
                        <button
                          key={style}
                          onClick={() => setVisualStyle(style)}
                          className={`rounded-xl border-2 p-4 text-center transition-all ${
                            visualStyle === style ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className={`mx-auto mb-2 rounded-lg bg-muted p-3 ${style === "original" ? "grid grid-cols-2 gap-1" : "space-y-1"}`}>
                            {style === "original" ? (
                              <>
                                <div className="h-4 rounded bg-primary/30" />
                                <div className="h-4 rounded bg-primary/30" />
                                <div className="h-4 rounded bg-primary/20" />
                                <div className="h-4 rounded bg-primary/20" />
                              </>
                            ) : (
                              <>
                                <div className="h-3 rounded bg-primary/30" />
                                <div className="h-3 rounded bg-primary/20" />
                                <div className="h-3 rounded bg-primary/10" />
                              </>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-foreground capitalize">{style === "original" ? "Grid Original" : "Estilo Netflix"}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Banners Rotativos</Label>
                    <div className="flex h-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-accent/30 transition-colors hover:border-primary/60">
                      <div className="text-center">
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload banner (1080×350)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="progress">Mostrar barra de progresso</Label>
                    <Switch id="progress" checked={showProgress} onCheckedChange={setShowProgress} />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground">Dados Gerais</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Informações básicas do seu aplicativo.</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Nome do App</Label>
                    <Input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="Meu App de Podologia" />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Login</Label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[
                        { value: "complete", label: "Completo", desc: "E-mail + Senha" },
                        { value: "easy", label: "Facilitado", desc: "Apenas E-mail" },
                        { value: "direct", label: "Direto", desc: "Sem Login" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setLoginType(opt.value)}
                          className={`rounded-xl border-2 p-3 text-left transition-all ${
                            loginType === opt.value ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                          <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva seu app..." rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label>E-mail de Suporte</Label>
                    <Input type="email" placeholder="suporte@meusite.com" />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground">Produtos</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Adicione os produtos do seu app.</p>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-accent/30 py-12">
                    <Package className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="font-semibold text-foreground">Nenhum produto criado</p>
                    <p className="text-sm text-muted-foreground mb-4">Adicione seu primeiro produto</p>
                    <Button variant="hero" className="gap-2">
                      <Package className="h-4 w-4" /> Adicionar Produto
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground">Módulos & Conteúdo</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Crie módulos com conteúdo multimídia.</p>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-accent/30 py-12">
                    <Layers className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="font-semibold text-foreground">Nenhum módulo criado</p>
                    <p className="text-sm text-muted-foreground mb-4">Primeiro crie um produto, depois adicione módulos</p>
                    <Button variant="hero" className="gap-2">
                      <Layers className="h-4 w-4" /> Criar Módulo
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground">Integrações</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Conecte com plataformas de pagamento.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {["Hotmart", "Kiwify", "PerfectPay", "Monetizze", "CartPanda", "Lastlink"].map((platform) => (
                      <div key={platform} className="flex items-center justify-between rounded-xl border bg-background p-4">
                        <span className="font-semibold text-foreground text-sm">{platform}</span>
                        <Button variant="outline" size="sm">Integrar</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={prev} disabled={currentStep === 0} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Anterior
                </Button>
                {currentStep < 5 ? (
                  <Button variant="hero" onClick={next} className="gap-2">
                    Próximo <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Link to="/dashboard">
                    <Button variant="hero" className="gap-2">
                      <Rocket className="h-4 w-4" /> Publicar App
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Mobile Preview */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <p className="mb-3 text-center text-sm font-semibold text-muted-foreground">Preview do App</p>
              <div className="mx-auto w-[280px] rounded-[2.5rem] border-[6px] border-foreground/10 bg-foreground/5 p-3">
                <div className="relative h-[500px] overflow-hidden rounded-[2rem] bg-background">
                  {/* Simulated app preview */}
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}08)` }}>
                    <div className="h-16 w-16 rounded-2xl gradient-primary mb-4 flex items-center justify-center">
                      <span className="text-2xl text-primary-foreground font-bold">
                        {appName ? appName.charAt(0).toUpperCase() : "P"}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-foreground">{welcomeText || "Seja Bem-Vindo!"}</h3>
                    <p className="mt-2 text-xs text-muted-foreground">{appName || "Meu App"}</p>
                    <div className="mt-6 w-full space-y-3">
                      <div className="h-10 rounded-lg bg-muted" />
                      <div className="h-10 rounded-lg bg-muted" />
                      <div className="h-10 rounded-lg" style={{ backgroundColor: primaryColor }} />
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">Já tem conta? <span style={{ color: primaryColor }}>Faça login</span></p>
                  </div>
                </div>
                <div className="absolute left-1/2 bottom-4 h-1 w-24 -translate-x-1/2 rounded-full bg-foreground/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppCreation;
