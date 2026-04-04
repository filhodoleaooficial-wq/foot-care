import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Footprints, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  offer_type: string;
}

// Horizontal scroll section component
const CardSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mb-10">
    <h2 className="text-lg font-bold text-foreground mb-4 px-6">{title}</h2>
    <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide">
      {children}
    </div>
  </section>
);

// Content card
const ContentCard = ({
  title,
  imageUrl,
  locked = false,
  onClick,
}: {
  title: string;
  imageUrl?: string | null;
  locked?: boolean;
  onClick?: () => void;
}) => (
  <motion.div
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="flex-shrink-0 w-40 cursor-pointer"
  >
    <div className="relative rounded-2xl overflow-hidden shadow-card bg-card border border-border">
      {/* Image */}
      <div
        className="aspect-[3/4] bg-muted bg-cover bg-center"
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      >
        {/* Lock overlay */}
        {locked && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
              <Lock className="h-7 w-7 text-yellow-900" />
            </div>
          </div>
        )}
      </div>

      {/* Green accent bar */}
      <div className="h-1 w-10 mx-auto mt-3" style={{ backgroundColor: "hsl(var(--vivabem-green))" }} />

      {/* Title */}
      <div className="p-3 pt-2 text-center">
        <p
          className="text-sm text-foreground leading-tight"
          dangerouslySetInnerHTML={{ __html: title }}
        />
      </div>
    </div>
  </motion.div>
);

const VivaBemHome = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, description, cover_url, offer_type")
        .eq("is_published", true)
        .order("sort_order");
      setProducts(data || []);
    };
    fetchProducts();
  }, []);

  // Split products by offer_type for demo sections
  const freeProducts = products.filter((p) => p.offer_type === "free");
  const premiumProducts = products.filter((p) => p.offer_type !== "free");

  return (
    <div className="min-h-screen bg-background">
      {/* Header with decorative blobs */}
      <header className="relative overflow-hidden py-10 px-6">
        {/* Blobs */}
        <div className="absolute top-[-40px] right-[-30px] w-40 h-40 rounded-full bg-primary/20 blur-2xl" />
        <div className="absolute top-10 left-[-20px] w-28 h-28 rounded-full bg-accent blur-2xl" />
        <div className="absolute bottom-[-30px] right-20 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />

        <div className="relative text-center">
          <Footprints className="h-10 w-10 text-primary mx-auto mb-2" />
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Pé<span className="text-gradient">Saúde</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground tracking-[0.15em]">
            Saúde dos Pés
          </p>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mt-0.5">
            CUIDADOS, EXERCÍCIOS e BEM-ESTAR
          </p>
        </div>
      </header>

      {/* Seus Treinos */}
      <CardSection title="Seus Cuidados">
        {freeProducts.length > 0 ? (
          freeProducts.map((product) => (
            <ContentCard
              key={product.id}
              title={product.name}
              imageUrl={product.cover_url}
              onClick={() => navigate(`/produto/${product.id}`)}
            />
          ))
        ) : (
          <>
            <ContentCard title='Cuidados<br/><b>Diários</b>' />
            <ContentCard title='Exercícios<br/><b>Semana 1</b>' />
            <ContentCard title='Alongamentos<br/><b>Para os Pés</b>' />
            <ContentCard title='Hidratação<br/><b>Correta</b>' />
          </>
        )}
      </CardSection>

      {/* Acelere seus Resultados — conteúdo pago, só aparece após pagamento */}
      {premiumProducts.length > 0 && (
        <CardSection title="Acelere seus Resultados">
          {premiumProducts.map((product) => (
            <ContentCard
              key={product.id}
              title={product.name}
              imageUrl={product.cover_url}
              locked
              onClick={() => navigate(`/produto/${product.id}`)}
            />
          ))}
        </CardSection>
      )}

      {/* Presentes para você! */}
      <CardSection title="Dicas Gratuitas">
        <ContentCard title='Como escolher o<br/><b>CALÇADO IDEAL</b>' />
        <ContentCard title='Escalda-pés<br/><b>RELAXANTE</b>' />
        <ContentCard title='Prevenção de<br/><b>CALOSIDADES</b>' />
      </CardSection>
    </div>
  );
};

export default VivaBemHome;
