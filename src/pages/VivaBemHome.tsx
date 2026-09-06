import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, BookOpen, ChevronLeft, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppConfig } from "@/contexts/AppConfigContext";
import { getClientSession } from "@/lib/client-session";
import { toast } from "sonner";

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  offer_type: string;
  section_id: string | null;
  price: number | null;
  recurring?: boolean;
}

interface SectionRow {
  id: string;
  title: string;
  sort_order: number;
  is_premium: boolean;
}

// Horizontal scroll section component
const CardSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-lg font-bold text-foreground mb-4 px-6">{title}</h2>
    <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide">{children}</div>
  </section>
);

// Purchase modal
const PurchaseModal = ({
  open,
  product,
  loading,
  onClose,
  onBuy,
}: {
  open: boolean;
  product: Product | null;
  loading: boolean;
  onClose: () => void;
  onBuy: () => void;
}) => {
  if (!product) return null;
  const isRecurring = product.recurring === true;
  const priceFormatted = product.price ? `R$ ${product.price.toFixed(2).replace(".", ",")}` : "R$ 27,90";
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="w-full sm:max-w-sm bg-background rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-1 rounded-full bg-muted" />
              <button onClick={onClose} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-center mb-5">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center mb-3">
                <Lock className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isRecurring
                  ? `Acesso completo por ${priceFormatted}/mês`
                  : `Libere este conteúdo por ${priceFormatted} (pagamento único)`}
              </p>
            </div>
            <button
              onClick={onBuy}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-lg disabled:opacity-50 transition-opacity"
            >
              {loading ? "Aguarde..." : isRecurring ? `Assinar por ${priceFormatted}/mês` : `Comprar por ${priceFormatted}`}
            </button>
            <p className="text-[11px] text-muted-foreground text-center mt-3">
              Você será redirecionado para o pagamento seguro do Stripe.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Content card
const ContentCard = ({
  title,
  imageUrl,
  locked = false,
  accentColor,
  onClick,
}: {
  title: string;
  imageUrl?: string | null;
  locked?: boolean;
  accentColor?: string;
  onClick?: () => void;
}) => (
  <motion.div whileTap={{ scale: 0.97 }} onClick={onClick} className="flex-shrink-0 w-40 cursor-pointer">
    <div className="relative rounded-2xl overflow-hidden shadow-card bg-card border border-border">
      <div
        className="aspect-[3/4] bg-muted bg-cover bg-center"
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      >
        {!imageUrl && (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        {locked && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
              <Lock className="h-7 w-7 text-yellow-900" />
            </div>
          </div>
        )}
      </div>
      <div
        className="h-1 w-10 mx-auto mt-3"
        style={{ backgroundColor: accentColor || "hsl(var(--vivabem-green))" }}
      />
      <div className="p-3 pt-2 text-center">
        <p className="text-sm text-foreground leading-tight">{title}</p>
      </div>
    </div>
  </motion.div>
);

interface Section {
  title: string;
  premium: boolean;
  order: number;
  products: Product[];
}

const VivaBemHome = () => {
  const navigate = useNavigate();
  const { app, loading: appLoading } = useAppConfig();
  const [products, setProducts] = useState<Product[]>([]);
  const [dbSections, setDbSections] = useState<SectionRow[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [purchaseProduct, setPurchaseProduct] = useState<Product | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerTimerRef = useRef<ReturnType<typeof setInterval>>();

  const handleProductCheckout = async (productId: string) => {
    const client = getClientSession();
    if (!client) {
      navigate("/login");
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { productId, clientId: client.id, baseUrl: window.location.origin },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      let msg = err?.message || "Erro desconhecido";
      try {
        const body = await err?.context?.json?.();
        if (body?.error) msg = typeof body.error === "string" ? body.error : JSON.stringify(body.error);
      } catch {}
      toast.error(msg, { duration: 8000 });
      console.error("Checkout error:", err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    if (!app) return;
    const fetchData = async () => {
      const client = getClientSession();
      const [prodRes, secRes, purchRes, bannerRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, description, cover_url, offer_type, section_id, price, recurring")
          .eq("app_id", app.id)
          .eq("is_published", true)
          .order("sort_order"),
        supabase
          .from("sections")
          .select("id, title, sort_order, is_premium")
          .eq("app_id", app.id)
          .eq("is_active", true)
          .order("sort_order"),
        client
          ? supabase.functions.invoke("list-purchases", { body: { clientId: client.id } })
          : Promise.resolve({ data: { productIds: [] as string[] } }),
        supabase
          .from("banners")
          .select("id, image_url, link_url, sort_order")
          .eq("app_id", app.id)
          .eq("is_active", true)
          .order("sort_order"),
      ]);
      setProducts(prodRes.data || []);
      setDbSections(secRes.data || []);
      const ids: string[] = (purchRes as any)?.data?.productIds ?? [];
      setPurchasedIds(new Set(ids));
      setBanners(bannerRes.data || []);
    };
    fetchData();
  }, [app]);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    bannerTimerRef.current = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(bannerTimerRef.current);
  }, [banners.length]);

  const prevBanner = () => {
    clearInterval(bannerTimerRef.current);
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };
  const nextBanner = () => {
    clearInterval(bannerTimerRef.current);
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };


  // Group products into sections from DB
  const sections: Section[] = (() => {
    if (dbSections.length === 0) {
      // Fallback: group by offer_type if no sections configured
      const map = new Map<string, Section>();
      for (const product of products) {
        const key = product.offer_type || "free";
        if (!map.has(key)) {
          map.set(key, {
            title: key.charAt(0).toUpperCase() + key.slice(1),
            premium: false,
            order: 99,
            products: [],
          });
        }
        map.get(key)!.products.push(product);
      }
      return Array.from(map.values()).sort((a, b) => a.order - b.order);
    }

    // Use DB sections
    const result: Section[] = [];
    for (const sec of dbSections) {
      const sectionProducts = products.filter((p) => p.section_id === sec.id);
      if (sectionProducts.length > 0) {
        result.push({
          title: sec.title,
          premium: sec.is_premium,
          order: sec.sort_order,
          products: sectionProducts,
        });
      }
    }
    // Products without a section go into "Outros"
    const unassigned = products.filter((p) => !p.section_id || !dbSections.find((s) => s.id === p.section_id));
    if (unassigned.length > 0) {
      result.push({ title: "Outros", premium: false, order: 999, products: unassigned });
    }
    return result.sort((a, b) => a.order - b.order);
  })();

  if (appLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <BookOpen className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-muted-foreground">Nenhum app publicado encontrado.</p>
      </div>
    );
  }

  const accentColor = app.primary_color;

  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic header */}
      <header className="relative overflow-hidden py-10 px-6">
        <div className="absolute top-[-40px] right-[-30px] w-40 h-40 rounded-full blur-2xl" style={{ backgroundColor: `${accentColor}30` }} />
        <div className="absolute top-10 left-[-20px] w-28 h-28 rounded-full bg-accent blur-2xl" />
        <div className="absolute bottom-[-30px] right-20 w-32 h-32 rounded-full blur-2xl" style={{ backgroundColor: `${accentColor}15` }} />

        <div className="relative text-center">
          {app.logo_url ? (
            <img src={app.logo_url} alt={app.name} className="h-12 w-12 rounded-xl object-cover mx-auto mb-2" />
          ) : (
            <div
              className="h-12 w-12 rounded-xl mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: accentColor }}
            >
              <span className="text-xl font-bold text-white">{app.name.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{app.name}</h1>
          {app.welcome_text && (
            <p className="mt-2 text-sm text-muted-foreground">{app.welcome_text}</p>
          )}
        </div>
      </header>

      {/* Banner carousel */}
      {banners.length > 0 && (
        <div className="mb-6">
          <div className="relative rounded-none sm:rounded-2xl sm:mx-6 overflow-hidden bg-muted">
            <div className="relative aspect-video sm:aspect-[21/9]">
              {banners.map((banner, i) => (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${i === currentBanner ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                  onClick={() => banner.link_url && window.open(banner.link_url, "_blank")}
                  style={{ cursor: banner.link_url ? "pointer" : "default" }}
                >
                  <img src={banner.image_url} alt="Banner" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {banners.length > 1 && (
              <>
                <button onClick={prevBanner} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={nextBanner} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm">
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                  {banners.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentBanner ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dynamic sections */}
      {sections.length > 0 ? (
        sections.map((section) => (
          <CardSection key={section.title} title={section.title}>
            {section.products.map((product) => {
              const isLocked = (section.premium || (product.price != null && product.price > 0)) && !purchasedIds.has(product.id);
              return (
                <ContentCard
                  key={product.id}
                  title={product.name}
                  imageUrl={product.cover_url}
                  accentColor={accentColor}
                  locked={isLocked}
                  onClick={() => {
                    if (isLocked) {
                      setPurchaseProduct(product);
                    } else {
                      navigate(`/produto/${product.id}`);
                    }
                  }}
                />
              );
            })}
          </CardSection>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">Em breve, novos conteúdos estarão disponíveis aqui.</p>
        </div>
      )}

      <PurchaseModal
        open={purchaseProduct !== null}
        product={purchaseProduct}
        loading={checkoutLoading}
        onClose={() => setPurchaseProduct(null)}
        onBuy={() => {
          if (purchaseProduct) handleProductCheckout(purchaseProduct.id);
        }}
      />
    </div>
  );
};

export default VivaBemHome;
