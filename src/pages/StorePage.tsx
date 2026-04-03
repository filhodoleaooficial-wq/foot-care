import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, ExternalLink, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface StoreProduct {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  price: number | null;
  sales_page_url: string | null;
}

const StorePage = () => {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, description, cover_url, price, sales_page_url")
        .eq("is_published", true)
        .neq("offer_type", "free")
        .order("sort_order");
      setProducts(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
        <ShoppingBag className="h-6 w-6 text-primary" />
        Loja
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Produtos selecionados para a saúde dos seus pés
      </p>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && products.length === 0 && (
        <p className="text-muted-foreground text-center py-10">
          Nenhum produto disponível na loja no momento.
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Image */}
            <div
              className="h-48 bg-muted bg-cover bg-center"
              style={product.cover_url ? { backgroundImage: `url(${product.cover_url})` } : undefined}
            >
              {!product.cover_url && (
                <div className="h-full flex items-center justify-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-5">
              <h3 className="font-bold text-foreground text-lg">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between">
                {product.price ? (
                  <div className="flex items-center gap-1.5 text-primary font-bold text-lg">
                    <Tag className="h-4 w-4" />
                    R$ {product.price.toFixed(2).replace(".", ",")}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Consultar preço</span>
                )}

                {product.sales_page_url ? (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => window.open(product.sales_page_url!, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Comprar
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    Em breve
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StorePage;
