import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Upload, Palette, Home, Settings, Package, Layers, Plug, Rocket, Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ProductModal from "@/components/ProductModal";
import ModuleModal from "@/components/ModuleModal";
import logoImg from "@/assets/logo-pesaude.png";

const steps = [
  { icon: Palette, label: "Visual Login" },
  { icon: Home, label: "Visual Home" },
  { icon: Settings, label: "Dados Gerais" },
  { icon: Package, label: "Produtos" },
  { icon: Layers, label: "Módulos" },
  { icon: Plug, label: "Integrações" },
];

interface ProductItem {
  id: string;
  name: string;
  offer_type: string;
  sort_order: number;
  cover_url: string | null;
}

interface ModuleItem {
  id: string;
  title: string;
  content_type: string;
  sort_order: number;
  cover_url: string | null;
  product_id: string;
}

const AppCreation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [appName, setAppName] = useState("");
  const [welcomeText, setWelcomeText] = useState("Seja Bem-Vindo!");
  const [primaryColor, setPrimaryColor] = useState("#FF4B8B");
  const [loginType, setLoginType] = useState("complete");
  const [visualStyle, setVisualStyle] = useState("original");
  const [showProgress, setShowProgress] = useState(true);
  const [description, setDescription] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [appId, setAppId] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Products state
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Modules state
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const colors = ["#FF4B8B", "#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#1A1A1A"];

  const next = async () => {
    // Auto-save app when leaving step 2 (Dados Gerais) if not saved yet
    if (currentStep === 2 && !appId) {
      await saveApp();
    }
    setCurrentStep((s) => Math.min(s + 1, 5));
  };
  const prev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("app-assets").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("app-assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, "logos");
      setLogoUrl(url);
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, "backgrounds");
      setBgUrl(url);
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    }
  };

  const saveApp = async () => {
    if (!appName.trim()) {
      toast({ title: "Nome obrigatório", description: "Defina um nome para o app.", variant: "destructive" });
      return null;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: user!.id,
        name: appName,
        description,
        logo_url: logoUrl,
        background_url: bgUrl,
        primary_color: primaryColor,
        welcome_text: welcomeText,
        login_type: loginType,
        visual_style: visualStyle,
        show_progress: showProgress,
        support_email: supportEmail || null,
        status: "draft" as const,
      };

      if (appId) {
        const { error } = await supabase.from("apps").update(payload).eq("id", appId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("apps").insert(payload).select("id").single();
        if (error) throw error;
        setAppId(data.id);
        return data.id;
      }
      return appId;
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const id = appId || await saveApp();
    if (!id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("apps").update({ status: "published" }).eq("id", id);
      if (error) throw error;
      toast({ title: "App publicado com sucesso! 🎉" });
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast({ title: "Erro ao publicar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    if (!appId) return;
    const { data } = await supabase
      .from("products")
      .select("id, name, offer_type, sort_order, cover_url")
      .eq("app_id", appId)
      .order("sort_order");
    setProducts(data || []);
    if (data && data.length > 0 && !selectedProductId) {
      setSelectedProductId(data[0].id);
    }
  };

  // Fetch modules
  const fetchModules = async () => {
    if (!appId) return;
    const { data } = await supabase
      .from("modules")
      .select("id, title, content_type, sort_order, cover_url, product_id")
      .in("product_id", products.map((p) => p.id))
      .order("sort_order");
    setModules(data || []);
  };

  useEffect(() => {
    if (appId && currentStep === 3) fetchProducts();
  }, [appId, currentStep]);

  useEffect(() => {
    if (products.length > 0 && currentStep === 4) fetchModules();
  }, [products, currentStep]);

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
    toast({ title: "Produto excluído" });
  };

  const deleteModule = async (id: string) => {
    await supabase.from("modules").delete().eq("id", id);
    fetchModules();
    toast({ title: "Módulo excluído" });
  };

  const offerTypeLabel = (type: string) => {
    const map: Record<string, string> = { main: "Principal", order_bump: "Order Bump", upsell: "Upsell", bonus: "Bônus", free: "Gratuito" };
    return map[type] || type;
  };

  const contentTypeLabel = (type: string) => {
    const map: Record<string, string> = { video: "🎬 Vídeo", pdf: "📄 PDF", download: "📥 Download", audio: "🎵 Áudio", text: "✏️ Texto", html: "🧩 HTML", link: "🔗 Link", iframe: "🌐 Web", pdf_drive: "📁 Drive", vturb: "📺 Vturb" };
    return map[type] || type;
  };

  const filteredModules = modules.filter((m) => m.product_id === selectedProductId);

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/admin/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
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
                  {i < currentStep ? <Check className="h-3.5 w-3.5" /> : <step.icon className="h-3.5 w-3.5" />}
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
              {/* Step 0 - Visual Login */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground">Personalização Visual — Tela de Login</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Configure a aparência da tela de login do seu app.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Logo do App</Label>
                    <input type="file" ref={logoInputRef} accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <div onClick={() => logoInputRef.current?.click()} className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-accent/30 transition-colors hover:border-primary/60 overflow-hidden">
                      {logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">Tamanho ideal: 200×200px (quadrado)</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Mensagem de Boas-vindas</Label>
                    <Input value={welcomeText} onChange={(e) => setWelcomeText(e.target.value)} placeholder="Seja Bem-Vindo!" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor Principal</Label>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((c) => (
                        <button key={c} onClick={() => setPrimaryColor(c)} className={`h-9 w-9 rounded-full border-2 transition-all ${primaryColor === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Plano de Fundo</Label>
                    <input type="file" ref={bgInputRef} accept="image/*" className="hidden" onChange={handleBgUpload} />
                    <div onClick={() => bgInputRef.current?.click()} className="flex h-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-accent/30 transition-colors hover:border-primary/60 overflow-hidden">
                      {bgUrl ? <img src={bgUrl} alt="Background" className="h-full w-full object-cover" /> : (
                        <div className="text-center">
                          <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                          <span className="text-xs text-muted-foreground mt-1">Upload imagem</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Tamanho ideal: 1920×1080px (fundo de tela)</p>
                  </div>
                </div>
              )}

              {/* Step 1 - Visual Home */}
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
                        <button key={style} onClick={() => setVisualStyle(style)} className={`rounded-xl border-2 p-4 text-center transition-all ${visualStyle === style ? "border-primary bg-accent" : "border-border hover:border-primary/40"}`}>
                          <div className={`mx-auto mb-2 rounded-lg bg-muted p-3 ${style === "original" ? "grid grid-cols-2 gap-1" : "space-y-1"}`}>
                            {style === "original" ? (<><div className="h-4 rounded bg-primary/30" /><div className="h-4 rounded bg-primary/30" /><div className="h-4 rounded bg-primary/20" /><div className="h-4 rounded bg-primary/20" /></>) : (<><div className="h-3 rounded bg-primary/30" /><div className="h-3 rounded bg-primary/20" /><div className="h-3 rounded bg-primary/10" /></>)}
                          </div>
                          <span className="text-sm font-semibold text-foreground capitalize">{style === "original" ? "Grid Original" : "Estilo Netflix"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="progress">Mostrar barra de progresso</Label>
                    <Switch id="progress" checked={showProgress} onCheckedChange={setShowProgress} />
                  </div>
                </div>
              )}

              {/* Step 2 - Dados Gerais */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground">Dados Gerais</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Informações básicas do seu aplicativo.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome do App *</Label>
                    <Input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="Meu App de Podologia" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Login</Label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[{ value: "complete", label: "Completo", desc: "E-mail + Senha" }, { value: "easy", label: "Facilitado", desc: "Apenas E-mail" }, { value: "direct", label: "Direto", desc: "Sem Login" }].map((opt) => (
                        <button key={opt.value} onClick={() => setLoginType(opt.value)} className={`rounded-xl border-2 p-3 text-left transition-all ${loginType === opt.value ? "border-primary bg-accent" : "border-border hover:border-primary/40"}`}>
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
                    <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="suporte@meusite.com" />
                  </div>
                </div>
              )}

              {/* Step 3 - Produtos */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-extrabold text-foreground">Produtos</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Adicione os produtos do seu app.</p>
                    </div>
                    {appId && (
                      <Button variant="hero" className="gap-2" onClick={() => { setEditingProduct(null); setProductModalOpen(true); }}>
                        <Plus className="h-4 w-4" /> Adicionar
                      </Button>
                    )}
                  </div>

                  {!appId && (
                    <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-6 text-center">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        Salve os dados gerais primeiro (clique em "Próximo" na etapa anterior)
                      </p>
                    </div>
                  )}

                  {appId && products.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-accent/30 py-12">
                      <Package className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="font-semibold text-foreground">Nenhum produto criado</p>
                      <p className="text-sm text-muted-foreground mb-4">Adicione seu primeiro produto</p>
                      <Button variant="hero" className="gap-2" onClick={() => { setEditingProduct(null); setProductModalOpen(true); }}>
                        <Package className="h-4 w-4" /> Adicionar Produto
                      </Button>
                    </div>
                  )}

                  {products.length > 0 && (
                    <div className="space-y-3">
                      {products.map((product, i) => (
                        <motion.div
                          key={product.id}
                          className="group flex items-center gap-3 rounded-xl border bg-background p-4 transition-all hover:shadow-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent flex-shrink-0">
                            {product.cover_url ? (
                              <img src={product.cover_url} alt="" className="h-full w-full rounded-xl object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground text-sm truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{offerTypeLabel(product.offer_type)} · Ordem {product.sort_order}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={async () => {
                                const { data } = await supabase.from("products").select("*").eq("id", product.id).single();
                                setEditingProduct(data);
                                setProductModalOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => deleteProduct(product.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4 - Módulos */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground">Módulos & Conteúdo</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Crie módulos com conteúdo multimídia.</p>
                  </div>

                  {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-accent/30 py-12">
                      <Layers className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="font-semibold text-foreground">Primeiro crie um produto</p>
                      <p className="text-sm text-muted-foreground">Volte à etapa anterior para criar um produto.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Label className="mb-1.5 block text-xs">Selecione o produto</Label>
                          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                            <SelectTrigger><SelectValue placeholder="Escolha..." /></SelectTrigger>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="hero" className="gap-2 mt-5" onClick={() => { setEditingModule(null); setModuleModalOpen(true); }} disabled={!selectedProductId}>
                          <Plus className="h-4 w-4" /> Módulo
                        </Button>
                      </div>

                      {filteredModules.length === 0 && (
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-accent/30 py-10">
                          <Layers className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="font-semibold text-foreground text-sm">Nenhum módulo</p>
                          <p className="text-xs text-muted-foreground">Adicione módulos a este produto</p>
                        </div>
                      )}

                      {filteredModules.length > 0 && (
                        <div className="space-y-3">
                          {filteredModules.map((mod, i) => (
                            <motion.div
                              key={mod.id}
                              className="group flex items-center gap-3 rounded-xl border bg-background p-4 transition-all hover:shadow-sm"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                            >
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent flex-shrink-0 overflow-hidden">
                                {mod.cover_url ? (
                                  <img src={mod.cover_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <BookOpen className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-foreground text-sm truncate">{mod.title}</p>
                                <p className="text-xs text-muted-foreground">{contentTypeLabel(mod.content_type)} · Ordem {mod.sort_order}</p>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={async () => {
                                    const { data } = await supabase.from("modules").select("*").eq("id", mod.id).single();
                                    setEditingModule(data);
                                    setModuleModalOpen(true);
                                  }}
                                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => deleteModule(mod.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Step 5 - Integrações */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground">Integrações</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Conecte com plataformas de pagamento.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {["Hotmart", "Kiwify", "PerfectPay", "Monetizze", "CartPanda", "Lastlink", "Payt", "Kirvano", "Ticto", "Guru"].map((platform) => (
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
                  <Button variant="hero" onClick={next} className="gap-2" disabled={saving}>
                    {saving ? "Salvando..." : "Próximo"} <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="hero" onClick={handlePublish} disabled={saving} className="gap-2">
                    <Rocket className="h-4 w-4" /> {saving ? "Publicando..." : "Publicar App"}
                  </Button>
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
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}08)` }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-2xl mb-4 object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-2xl gradient-primary mb-4 flex items-center justify-center">
                        <span className="text-2xl text-primary-foreground font-bold">{appName ? appName.charAt(0).toUpperCase() : "P"}</span>
                      </div>
                    )}
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

      {/* Modals */}
      {appId && (
        <>
          <ProductModal
            open={productModalOpen}
            onOpenChange={setProductModalOpen}
            appId={appId}
            userId={user!.id}
            onProductCreated={fetchProducts}
            existingProduct={editingProduct}
          />
          <ModuleModal
            open={moduleModalOpen}
            onOpenChange={setModuleModalOpen}
            productId={selectedProductId}
            userId={user!.id}
            onModuleCreated={fetchModules}
            existingModule={editingModule}
          />
        </>
      )}
    </div>
  );
};

export default AppCreation;
