import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, Package, GripVertical, Eye, EyeOff, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ProductModal from "@/components/ProductModal";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Product {
  id: string;
  name: string;
  description: string | null;
  offer_type: string;
  is_published: boolean;
  sort_order: number;
  cover_url: string | null;
  created_at: string;
  column_count: number;
  price: number | null;
  release_type: string;
  release_value: string | null;
  hidden_name: boolean;
  external_product_id: string | null;
  redirect_to_sales: boolean;
  sales_page_url: string | null;
  logo_unlocked_url: string | null;
  logo_locked_url: string | null;
  app_id: string;
  user_id: string;
}

const offerTypeLabels: Record<string, string> = {
  main: "Principal",
  order_bump: "Order Bump",
  upsell: "Upsell",
  bonus: "Bônus",
};

/* ─── Sortable Product Card ─── */
const SortableProductCard = ({
  product,
  onTogglePublish,
  onEdit,
  onDelete,
}: {
  product: Product;
  onTogglePublish: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover ${isDragging ? "ring-2 ring-primary/40" : ""}`}
    >
      <div className="flex items-start gap-4">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          {product.logo_unlocked_url ? (
            <img src={product.logo_unlocked_url} alt="" className="h-full w-full rounded-xl object-cover" />
          ) : (
            <Package className="h-6 w-6" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground truncate">{product.name}</h3>
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {offerTypeLabels[product.offer_type] || product.offer_type}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                product.is_published ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
              }`}
            >
              {product.is_published ? "Publicado" : "Rascunho"}
            </span>
          </div>
          {product.description && (
            <p className="mt-1 text-sm text-muted-foreground truncate">{product.description}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Ordem: {product.sort_order} · {product.column_count} coluna{product.column_count > 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onTogglePublish(product)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title={product.is_published ? "Despublicar" : "Publicar"}
          >
            {product.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onEdit(product)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
const ProductsManagement = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [appName, setAppName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (appId) {
      fetchApp();
      fetchProducts();
    }
  }, [appId]);

  const fetchApp = async () => {
    const { data } = await supabase.from("apps").select("name").eq("id", appId!).single();
    if (data) setAppName(data.name);
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("app_id", appId!)
      .order("sort_order", { ascending: true });
    if (error) console.error("Error fetching products:", error);
    else setProducts(data || []);
    setLoading(false);
  };

  const togglePublish = async (product: Product) => {
    const { error } = await supabase
      .from("products")
      .update({ is_published: !product.is_published })
      .eq("id", product.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_published: !p.is_published } : p))
      );
    }
  };

  const deleteProduct = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("products").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== deleteId));
      toast({ title: "Produto excluído" });
    }
    setDeleteId(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(products, oldIndex, newIndex).map((p, i) => ({
      ...p,
      sort_order: i,
    }));

    setProducts(reordered);

    // Persist new order
    const updates = reordered.map((p) =>
      supabase.from("products").update({ sort_order: p.sort_order }).eq("id", p.id)
    );
    await Promise.all(updates);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-foreground truncate">
              Produtos — {appName}
            </h1>
          </div>
          <Button variant="hero" className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo Produto
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary">
              <Package className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-foreground">Nenhum produto ainda</h2>
            <p className="mt-2 text-muted-foreground">Crie seu primeiro produto para começar.</p>
            <Button variant="hero" className="mt-6 gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Criar Produto
            </Button>
          </motion.div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {products.map((product) => (
                  <SortableProductCard
                    key={product.id}
                    product={product}
                    onTogglePublish={togglePublish}
                    onEdit={openEdit}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {user && appId && (
        <ProductModal
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) setEditingProduct(null);
          }}
          appId={appId}
          userId={user.id}
          onProductCreated={fetchProducts}
          existingProduct={editingProduct}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os módulos e aulas associados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductsManagement;
