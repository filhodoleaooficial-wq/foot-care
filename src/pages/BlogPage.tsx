import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BlogArticle {
  id: string;
  title: string;
  description: string | null;
  content_html: string | null;
  created_at: string;
  cover_url: string | null;
}

const BlogPage = () => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("modules")
        .select("id, title, description, content_html, created_at, cover_url")
        .eq("is_published", true)
        .eq("content_type", "text")
        .order("created_at", { ascending: false })
        .limit(50);
      setArticles((data || []) as BlogArticle[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-background p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-primary" />
        Blog
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Artigos e dicas sobre saúde dos pés
      </p>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && articles.length === 0 && (
        <p className="text-muted-foreground text-center py-10">
          Nenhum artigo publicado ainda.
        </p>
      )}

      <div className="space-y-4">
        {articles.map((article, i) => {
          const isOpen = expandedId === article.id;
          return (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
            >
              {/* Header */}
              <button
                onClick={() => setExpandedId(isOpen ? null : article.id)}
                className="w-full text-left p-5 flex items-start gap-4"
              >
                {article.cover_url && (
                  <img
                    src={article.cover_url}
                    alt={article.title}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-foreground text-lg leading-snug">
                    {article.title}
                  </h2>
                  {article.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(article.created_at)}
                  </div>
                </div>
                <div className="flex-shrink-0 mt-1 text-muted-foreground">
                  {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {/* Content */}
              <AnimatePresence>
                {isOpen && article.content_html && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-border pt-4">
                      <div
                        className="prose prose-sm max-w-none text-foreground"
                        dangerouslySetInnerHTML={{ __html: article.content_html }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BlogPage;
