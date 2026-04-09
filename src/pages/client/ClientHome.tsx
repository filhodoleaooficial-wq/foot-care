import { useState, useEffect, useRef } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Search, User, Home, BookOpen, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AppConfig } from "./ClientAppLayout";

interface Product {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  section_id: string | null;
}

interface SectionRow {
  id: string;
  title: string;
  sort_order: number;
  is_premium: boolean;
}

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
}

const ClientHome = () => {
  const app = useOutletContext<AppConfig>();
  const { appId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [dbSections, setDbSections] = useState<SectionRow[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const bannerInterval = useRef<NodeJS.Timeout>();

  const color = app.primary_color;

  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, bannerRes, secRes] = await Promise.all([
        supabase.from("products").select("id, name, description, cover_url, section_id").eq("app_id", appId!).eq("is_published", true).order("sort_order"),
        supabase.from("banners").select("id, image_url, link_url").eq("app_id", appId!).eq("is_active", true).order("sort_order"),
        supabase.from("sections").select("id, title, sort_order, is_premium").eq("app_id", appId!).eq("is_active", true).order("sort_order"),
      ]);
      setProducts(prodRes.data || []);
      setBanners(bannerRes.data || []);
      setDbSections(secRes.data || []);
    };
    fetchData();
  }, [appId]);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    bannerInterval.current = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(bannerInterval.current);
  }, [banners.length]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build grouped sections
  const groupedSections = (() => {
    const source = searchQuery ? filteredProducts : products;
    if (dbSections.length === 0) {
      return [{ title: "Conteúdos", premium: false, products: source }];
    }
    const result: { title: string; premium: boolean; products: Product[] }[] = [];
    for (const sec of dbSections) {
      const items = source.filter((p) => p.section_id === sec.id);
      if (items.length > 0) result.push({ title: sec.title, premium: sec.is_premium, products: items });
    }
    const unassigned = source.filter((p) => !p.section_id || !dbSections.find((s) => s.id === p.section_id));
    if (unassigned.length > 0) result.push({ title: "Outros", premium: false, products: unassigned });
    return result;
  })();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-4 shadow-sm"
        style={{ backgroundColor: color }}
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            {app.logo_url ? (
              <img src={app.logo_url} alt={app.name} className="h-9 w-9 rounded-xl object-cover" />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold">{app.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 className="text-white font-bold text-base leading-tight">{app.name}</h1>
              <p className="text-white/70 text-xs">Bem-vindo!</p>
            </div>
          </div>
          <button className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">
        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar conteúdo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:ring-2"
            style={{ "--tw-ring-color": color } as any}
          />
        </div>

        {/* Progress bar */}
        {app.show_progress && products.length > 0 && (
          <div className="mt-4 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-foreground">Seu progresso</span>
              <span className="text-muted-foreground">0%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: "0%", backgroundColor: color }} />
            </div>
          </div>
        )}

        {/* Banners */}
        {banners.length > 0 && (
          <div className="mt-4 relative overflow-hidden rounded-2xl shadow-md" style={{ aspectRatio: "1080/350" }}>
            <AnimatePresence mode="wait">
              <motion.img
                key={banners[activeBanner]?.id}
                src={banners[activeBanner]?.image_url}
                alt="Banner"
                className="w-full h-full object-cover"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4 }}
              />
            </AnimatePresence>
            {banners.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveBanner(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeBanner ? "w-5" : "w-1.5 bg-white/50"
                    }`}
                    style={i === activeBanner ? { backgroundColor: "white" } : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Products */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">
            {products.length > 0 ? "Conteúdos" : "Nenhum conteúdo disponível"}
          </h2>

          {filteredProducts.length === 0 && products.length > 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum resultado para "{searchQuery}"
            </p>
          )}

          {app.visual_style === "netflix" ? (
            // Netflix-style horizontal scroll
            <div className="space-y-6">
              {filteredProducts.map((product) => (
                <div key={product.id}>
                  <button
                    onClick={() => navigate(`/app/${appId}/product/${product.id}`)}
                    className="group flex items-center justify-between w-full text-left mb-2"
                  >
                    <h3 className="font-bold text-foreground text-sm">{product.name}</h3>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>
                  <div
                    className="h-36 rounded-2xl bg-gradient-to-br from-muted to-muted/50 overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
                    onClick={() => navigate(`/app/${appId}/product/${product.id}`)}
                    style={product.cover_url ? { backgroundImage: `url(${product.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                  >
                    {!product.cover_url && (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  {product.description && (
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Grid style
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  className="cursor-pointer rounded-2xl border bg-card overflow-hidden shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                  onClick={() => navigate(`/app/${appId}/product/${product.id}`)}
                  whileTap={{ scale: 0.97 }}
                >
                  <div
                    className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50"
                    style={product.cover_url ? { backgroundImage: `url(${product.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                  >
                    {!product.cover_url && (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-foreground text-sm leading-tight">{product.name}</h3>
                    {product.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-sm">Em breve, novos conteúdos estarão disponíveis aqui.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-lg safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {[
            { icon: Home, label: "Início", active: true },
            { icon: BookOpen, label: "Conteúdo", active: false },
            { icon: User, label: "Perfil", active: false },
            { icon: Settings, label: "Config", active: false },
          ].map((item) => (
            <button
              key={item.label}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 text-xs font-medium transition-colors ${
                item.active ? "font-semibold" : "text-muted-foreground"
              }`}
              style={item.active ? { color } : undefined}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default ClientHome;
