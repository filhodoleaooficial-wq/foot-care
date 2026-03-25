import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Trash2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SavedItem {
  id: string;
  module_id: string;
  module_title: string;
  module_cover: string | null;
}

const SavedModulesPage = () => {
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const clientEmail = localStorage.getItem("vivabem_client_email") || "";

  const fetchSaved = async () => {
    if (!clientEmail) return;
    const { data } = await supabase
      .from("saved_modules")
      .select("id, module_id")
      .eq("client_email", clientEmail)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) {
      setSaved([]);
      return;
    }

    const moduleIds = data.map((d) => d.module_id);
    const { data: modules } = await supabase
      .from("modules")
      .select("id, title, cover_url")
      .in("id", moduleIds);

    const items: SavedItem[] = data.map((d) => {
      const mod = modules?.find((m) => m.id === d.module_id);
      return {
        id: d.id,
        module_id: d.module_id,
        module_title: mod?.title || "Módulo",
        module_cover: mod?.cover_url || null,
      };
    });
    setSaved(items);
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("saved_modules").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover.");
    } else {
      setSaved((prev) => prev.filter((s) => s.id !== id));
      toast.success("Removido dos salvos.");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Star className="h-6 w-6 text-primary fill-primary" />
        Módulos Salvos
      </h1>

      {saved.length === 0 && (
        <p className="text-muted-foreground text-center py-10">
          Você ainda não salvou nenhum módulo.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {saved.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
          >
            <div
              className="aspect-video bg-muted bg-cover bg-center flex items-center justify-center"
              style={item.module_cover ? { backgroundImage: `url(${item.module_cover})` } : undefined}
            >
              {!item.module_cover && <BookOpen className="h-8 w-8 text-muted-foreground" />}
            </div>
            <div className="p-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground truncate flex-1">
                {item.module_title}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleRemove(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SavedModulesPage;
