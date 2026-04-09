import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plus, ExternalLink, Package, Rocket, Pencil, Trash2, Menu, X, LayoutDashboard, ShoppingBag, BarChart3, Settings, HelpCircle, Users, Link2, LogOut, CreditCard, Crown, Copy, Check, MessageSquare, Share2, Layers } from "lucide-react";
import DeployDialog from "@/components/DeployDialog";
import { useAuth, STRIPE_PRICES } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo-pesaude.png";

interface App {
  id: string;
  name: string;
  status: string;
  primary_color: string;
  created_at: string;
}

interface SidebarCounts {
  apps: number;
  products: number;
}

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apps, setApps] = useState<App[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);
  const [deployApp, setDeployApp] = useState<App | null>(null);
  const [sidebarCounts, setSidebarCounts] = useState<SidebarCounts>({ apps: 0, products: 0 });
  const { user, signOut, subscription, checkSubscription } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast({ title: "Assinatura ativada!", description: "Seu plano Pro está ativo." });
      checkSubscription();
    }
  }, [searchParams]);

  useEffect(() => {
    if (subscription.subscribed) {
      fetchApps();
    } else {
      setLoadingApps(false);
    }
  }, [subscription.subscribed]);

  const fetchApps = async () => {
    const { data, error } = await supabase
      .from("apps")
      .select("id, name, status, primary_color, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching apps:", error);
    } else {
      setApps(data || []);
      setSidebarCounts((prev) => ({ ...prev, apps: (data || []).length }));
    }
    setLoadingApps(false);

    // Fetch product count
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    setSidebarCounts((prev) => ({ ...prev, products: count || 0 }));
  };

  const deleteApp = async (id: string) => {
    const { error } = await supabase.from("apps").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      setApps((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "App excluído" });
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const priceId = billingPeriod === "monthly" ? STRIPE_PRICES.monthly : STRIPE_PRICES.yearly;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 lg:hidden">
        <button onClick={() => setSidebarOpen(true)} className="text-foreground">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="PéSaúde" className="h-6 w-6" />
          <span className="font-bold text-foreground">PéSaúde</span>
        </div>
        <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-foreground/20" />
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 transform border-r bg-card transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="PéSaúde" className="h-7 w-7" />
            <span className="text-lg font-extrabold text-foreground">PéSaúde</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {[
            { icon: LayoutDashboard, label: "Meus Apps", href: "/dashboard", count: sidebarCounts.apps },
            { icon: ShoppingBag, label: "Produtos", href: "/dashboard", count: sidebarCounts.products },
            { icon: MessageSquare, label: "WhatsApp", href: "/whatsapp" },
            { icon: BarChart3, label: "Vendas", href: "/dashboard" },
            { icon: Link2, label: "Integrações", href: "/dashboard" },
            { icon: Users, label: "Meus Clientes", href: "/dashboard" },
            { icon: HelpCircle, label: "Suporte", href: "/dashboard" },
            { icon: Settings, label: "Configurações", href: "/dashboard" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.count !== undefined && item.count > 0 && (
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {item.count}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Subscription status in sidebar */}
        <div className="absolute bottom-16 left-0 right-0 px-3">
          {subscription.subscribed ? (
            <div className="rounded-lg border border-primary/30 bg-accent/50 p-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-primary">
                <Crown className="h-3.5 w-3.5" /> Plano Pro
              </div>
              <button onClick={handleManageSubscription} className="mt-2 flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <CreditCard className="h-3 w-3" /> Gerenciar assinatura
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-950">
              <p className="font-semibold text-amber-700 dark:text-amber-300">Sem assinatura ativa</p>
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-0 right-0 px-3">
          <div className="rounded-lg border bg-background p-3 text-xs">
            <p className="font-medium text-foreground truncate">{user?.email}</p>
            <button onClick={handleSignOut} className="mt-2 flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <LogOut className="h-3 w-3" /> Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8">
        {!subscription.subscribed ? (
          /* Subscription gate */
          <motion.div
            className="mx-auto max-w-lg text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground">Assine o Plano Pro</h2>
            <p className="mt-3 text-muted-foreground">
              Para criar e gerenciar seus apps, assine o plano Pro.
            </p>

            {/* Billing toggle */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${billingPeriod === "monthly" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${billingPeriod === "yearly" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                Anual <span className="ml-1 text-xs opacity-80">-30%</span>
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-primary/30 bg-card p-8 shadow-card">
              <div className="text-4xl font-extrabold text-foreground">
                {billingPeriod === "monthly" ? "R$ 97,90" : "R$ 67,90"}
                <span className="text-base font-normal text-muted-foreground">
                  {billingPeriod === "monthly" ? "/mês" : "/mês (anual)"}
                </span>
              </div>
              <Button
                variant="hero"
                size="lg"
                className="mt-6 w-full"
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? "Redirecionando..." : "Assinar Agora"}
              </Button>
            </div>

            <button
              onClick={checkSubscription}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
            >
              Já assinei? Verificar status
            </button>
          </motion.div>
        ) : (
          /* Dashboard content */
          <>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">Meus Aplicativos</h1>
                <p className="mt-1 text-muted-foreground">Gerencie e crie seus apps de cuidados com os pés.</p>
              </div>
              <Link to="/admin/create-app">
                <Button variant="hero" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Novo App
                </Button>
              </Link>
            </div>

            {loadingApps ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {apps.map((app, i) => (
                  <motion.div
                    key={app.id}
                    className="group rounded-xl border bg-card p-6 shadow-card transition-all hover:shadow-card-hover"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-lg"
                          style={{ backgroundColor: app.primary_color || "hsl(var(--primary))" }}
                        >
                          {app.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{app.name}</h3>
                          <span
                            className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              app.status === "published"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {app.status === "published" ? "Publicado" : "Rascunho"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteApp(app.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <Button
                        variant="hero"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => setDeployApp(app)}
                      >
                        <Share2 className="h-3 w-3" /> Deploy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => navigate(`/admin/app/${app.id}/products`)}
                      >
                        <Package className="h-3 w-3" /> Produtos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => navigate(`/admin/app/${app.id}/sections`)}
                      >
                        <Layers className="h-3 w-3" /> Seções
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => {
                          const url = `${window.location.origin}/app/${app.id}`;
                          navigator.clipboard.writeText(url);
                          setCopiedAppId(app.id);
                          toast({ title: "Link copiado!", description: url });
                          setTimeout(() => setCopiedAppId(null), 2000);
                        }}
                      >
                        {copiedAppId === app.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedAppId === app.id ? "Copiado" : "Link"}
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {/* Create new card */}
                <Link to="/admin/create-app">
                  <motion.div
                    className="flex h-full min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-accent/30 p-6 text-center transition-all hover:border-primary/60 hover:bg-accent/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
                      <Plus className="h-6 w-6" />
                    </div>
                    <p className="mt-3 font-semibold text-foreground">Criar Novo App</p>
                    <p className="mt-1 text-xs text-muted-foreground">6 etapas simples</p>
                  </motion.div>
                </Link>
              </div>
            )}
          </>
        )}
      </main>

      {/* Deploy dialog */}
      {deployApp && (
        <DeployDialog
          open={!!deployApp}
          onOpenChange={(open) => !open && setDeployApp(null)}
          appId={deployApp.id}
          appName={deployApp.name}
          status={deployApp.status}
          onPublish={async () => {
            const newStatus = deployApp.status === "published" ? "draft" : "published";
            const { error } = await supabase
              .from("apps")
              .update({ status: newStatus })
              .eq("id", deployApp.id);
            if (error) {
              toast({ title: "Erro", description: error.message, variant: "destructive" });
            } else {
              setApps((prev) =>
                prev.map((a) => (a.id === deployApp.id ? { ...a, status: newStatus } : a))
              );
              setDeployApp({ ...deployApp, status: newStatus });
              toast({ title: newStatus === "published" ? "App publicado!" : "App despublicado" });
            }
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
