import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, MessageCircle, FileText, Star, Download, Search, ChevronLeft, ChevronRight, ShoppingBag, BookOpen, LogOut, Menu, X } from "lucide-react";
import { clearClientSession } from "@/lib/client-session";
import { motion, AnimatePresence } from "framer-motion";
import { useAppConfig } from "@/contexts/AppConfigContext";

const menuItems = [
  { icon: Home, label: "Início", path: "/home" },
  { icon: MessageCircle, label: "Comunidade", path: "/comunidade" },
  { icon: FileText, label: "Feed", path: "/feed" },
  { icon: ShoppingBag, label: "Loja", path: "/loja" },
  { icon: BookOpen, label: "Blog", path: "/blog" },
  { icon: Star, label: "Módulos salvos", path: "/salvos" },
  { icon: Download, label: "Instalar App", path: "/instalar" },
  { icon: Search, label: "Pesquisar", path: "/pesquisar" },
];

interface VivaBemSidebarProps {
  points?: number;
  onToggle?: (open: boolean) => void;
}

const VivaBemSidebar = ({ points = 78, onToggle }: VivaBemSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { app } = useAppConfig();

  const accentColor = app?.primary_color || "hsl(var(--vivabem-green))";
  const appName = app?.name || "App";

  useEffect(() => {
    setMobileOpen(false);
    onToggle?.(false);
  }, [location.pathname]);

  const toggleMobile = () => {
    const next = !mobileOpen;
    setMobileOpen(next);
    onToggle?.(next);
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={toggleMobile}
        className="fixed top-4 left-4 z-[60] md:hidden flex items-center justify-center h-10 w-10 rounded-full bg-white/20 backdrop-blur-md text-white shadow-lg"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={toggleMobile}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen flex flex-col transition-all duration-300 ${
          collapsed ? "w-16" : "w-56"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ backgroundColor: "hsl(var(--sidebar-background))" }}
      >
        {/* Logo / App name */}
        <div className="flex items-center gap-2 px-4 pt-6 pb-2">
          {app?.logo_url ? (
            <img src={app.logo_url} alt={appName} className="h-6 w-6 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div
              className="h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              <span className="text-xs font-bold text-white">{appName.charAt(0)}</span>
            </div>
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-lg font-bold text-white overflow-hidden whitespace-nowrap"
              >
                {appName}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Points badge */}
        <div className="px-4 py-3">
          <div
            className={`rounded-full flex items-center justify-center font-bold text-white text-sm ${
              collapsed ? "w-9 h-9 mx-auto" : "w-10 h-10"
            }`}
            style={{ backgroundColor: accentColor }}
          >
            {points}
          </div>
        </div>

        {/* Menu items */}
        <nav className="flex-1 px-2 py-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
                }`}
                style={isActive ? { color: accentColor } : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={() => {
            clearClientSession();
            navigate("/login");
          }}
          className="mx-2 mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Sair</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-auto mb-6 hidden md:flex items-center justify-center h-8 w-8 rounded-full bg-sidebar-accent text-sidebar-foreground hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>
    </>
  );
};

export default VivaBemSidebar;
