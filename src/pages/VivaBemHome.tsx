import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, STRIPE_PRICES } from "@/contexts/AuthContext";
import { useAppConfig } from "@/contexts/AppConfigContext";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  offer_type: string;
}

// Section configuration derived from offer_type
const SECTION_MAP: Record<string, { title: string; premium: boolean; order: number }> = {
  free: { title: "Seus Cuidados", premium: false, order: 1 },
  main: { title: "Acelere seus Resultados", premium: true, order: 2 },
  principal: { title: "Acelere seus Resultados", premium: true, order: 2 },
  order_bump: { title: "Acelere seus Resultados", premium: true, order: 2 },
  dica: { title: "Dicas Gratuitas", premium: false, order: 3 },
  exercicio: { title: "Exercícios para os Pés", premium: true, order: 4 },
  receita: { title: "Receitas Caseiras", premium: false, order: 5 },
};

// Horizontal scroll section component
const CardSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-lg font-bold text-foreground mb-4 px-6">{title}</h2>
    <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide">{children}</div>
  </section>
);

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
  const { subscription } = useAuth();
  const { app, loading: appLoading } = useAppConfig();
  const [products, setProducts] = useState<Product[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handlePremiumCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_PRICES.monthly },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error("Erro ao iniciar pagamento: " + (err.message || "Tente novamente"));
    } finally {
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    if (!app) return;
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, description, cover_url, offer_type")
        .eq("app_id", app.id)
        .eq("is_published", true)
        .order("sort_order");
      setProducts(data || []);
    };
    fetchProducts();
  }, [app]);

  // Group products into sections dynamically
  const sections: Section[] = (() => {
    const map = new Map<string, Section>();
    for (const product of products) {
      const config = SECTION_MAP[product.offer_type] || {
        title: product.offer_type.charAt(0).toUpperCase() + product.offer_type.slice(1),
        premium: false,
        order: 99,
      };
      const key = config.title;
      if (!map.has(key)) {
        map.set(key, { title: config.title, premium: config.premium, order: config.order, products: [] });
      }
      map.get(key)!.products.push(product);
    }
    return Array.from(map.values()).sort((a, b) => a.order - b.order);
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

      {/* Dynamic sections */}
      {sections.length > 0 ? (
        sections.map((section) => (
          <CardSection key={section.title} title={section.title}>
            {section.products.map((product) => (
              <ContentCard
                key={product.id}
                title={product.name}
                imageUrl={product.cover_url}
                accentColor={accentColor}
                locked={section.premium && !subscription.subscribed}
                onClick={() => {
                  if (section.premium && !subscription.subscribed) {
                    toast("Conteúdo Premium 🔒", {
                      description: "Este conteúdo é exclusivo para assinantes. Assine para desbloquear!",
                      action: {
                        label: checkoutLoading ? "Aguarde..." : "Assinar agora",
                        onClick: () => handlePremiumCheckout(),
                      },
                      duration: 6000,
                    });
                  } else {
                    navigate(`/produto/${product.id}`);
                  }
                }}
              />
            ))}
          </CardSection>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">Em breve, novos conteúdos estarão disponíveis aqui.</p>
        </div>
      )}
    </div>
  );
};

export default VivaBemHome;
