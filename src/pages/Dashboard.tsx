import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plus, ExternalLink, Package, Rocket, Pencil, Trash2, Menu, X, LayoutDashboard, ShoppingBag, BarChart3, Settings, HelpCircle, Users, Link2 } from "lucide-react";
import logoImg from "@/assets/logo-pesaude.png";

const mockApps = [
  { id: "1", name: "Podologia Premium", slug: "podologia-premium", status: "published" as const },
  { id: "2", name: "Cuidados Básicos", slug: "cuidados-basicos", status: "draft" as const },
];

const sidebarItems = [
  { icon: LayoutDashboard, label: "Meus Apps", href: "/dashboard" },
  { icon: ShoppingBag, label: "Produtos", href: "#" },
  { icon: BarChart3, label: "Vendas", href: "#" },
  { icon: Link2, label: "Integrações", href: "#" },
  { icon: Users, label: "Meus Clientes", href: "#" },
  { icon: HelpCircle, label: "Suporte", href: "#" },
  { icon: Settings, label: "Configurações", href: "#" },
];

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <div className="w-5" />
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
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">Meus Aplicativos</h1>
            <p className="mt-1 text-muted-foreground">Gerencie e crie seus apps de cuidados com os pés.</p>
          </div>
          <Link to="/app/new">
            <Button variant="hero" className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Novo App
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {mockApps.map((app, i) => (
            <motion.div
              key={app.id}
              className="group rounded-xl border bg-card p-6 shadow-card transition-all hover:shadow-card-hover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground font-bold text-lg">
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
                  <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="h-3 w-3" /> Link
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Package className="h-3 w-3" /> Produtos
                </Button>
                <Button variant="hero" size="sm" className="gap-1.5 text-xs">
                  <Rocket className="h-3 w-3" /> Publicar
                </Button>
              </div>
            </motion.div>
          ))}

          {/* Create new card */}
          <Link to="/app/new">
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
      </main>
    </div>
  );
};

export default Dashboard;
