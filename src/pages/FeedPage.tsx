import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, BookOpen, Video, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FeedItem {
  id: string;
  title: string;
  type: "module" | "lesson";
  content_type?: string;
  created_at: string;
}

const iconMap: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  module: <BookOpen className="h-4 w-4" />,
};

const FeedPage = () => {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const fetchFeed = async () => {
      const [{ data: modules }, { data: lessons }] = await Promise.all([
        supabase
          .from("modules")
          .select("id, title, content_type, created_at")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("lessons")
          .select("id, title, content_type, created_at")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const feed: FeedItem[] = [
        ...(modules || []).map((m) => ({ ...m, type: "module" as const })),
        ...(lessons || []).map((l) => ({ ...l, type: "lesson" as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setItems(feed);
    };
    fetchFeed();
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        Novidades
      </h1>

      {items.length === 0 && (
        <p className="text-muted-foreground text-center py-10">Nenhuma novidade por enquanto.</p>
      )}

      <div className="space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={`${item.type}-${item.id}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
              {iconMap[item.content_type || "module"]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.type === "module" ? "Novo módulo" : "Nova aula"} · {formatDate(item.created_at)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeedPage;
