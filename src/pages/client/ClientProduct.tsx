import { useState, useEffect } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, FileText, BookOpen, Clock, ChevronRight, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AppConfig } from "./ClientAppLayout";

interface Module {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content_type: string;
  duration_minutes: number | null;
}

const ClientProduct = () => {
  const app = useOutletContext<AppConfig>();
  const { appId, productId } = useParams();
  const navigate = useNavigate();
  const [productName, setProductName] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const color = app.primary_color;

  useEffect(() => {
    const fetchData = async () => {
      // Fetch product name
      const { data: product } = await supabase
        .from("products")
        .select("name")
        .eq("id", productId!)
        .single();

      if (product) setProductName(product.name);

      // Fetch modules with lessons
      const { data: modulesData } = await supabase
        .from("modules")
        .select("id, title, description, cover_url")
        .eq("product_id", productId!)
        .eq("is_published", true)
        .order("sort_order");

      if (modulesData) {
        const modulesWithLessons = await Promise.all(
          modulesData.map(async (mod) => {
            const { data: lessons } = await supabase
              .from("lessons")
              .select("id, title, content_type, duration_minutes")
              .eq("module_id", mod.id)
              .eq("is_published", true)
              .order("sort_order");
            return { ...mod, lessons: lessons || [] };
          })
        );
        setModules(modulesWithLessons);
        if (modulesWithLessons.length > 0) {
          setExpandedModule(modulesWithLessons[0].id);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [productId]);

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video": return <Play className="h-4 w-4" />;
      case "pdf": return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: `${color} transparent ${color} ${color}` }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3.5 shadow-sm"
        style={{ backgroundColor: color }}
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={() => navigate(`/app/${appId}/home`)}
            className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 text-white" />
          </button>
          <h1 className="text-white font-bold text-base truncate">{productName}</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-4">
        {modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-foreground">Nenhum módulo disponível</p>
            <p className="text-sm text-muted-foreground mt-1">Os módulos serão adicionados em breve.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.id}
                className="rounded-2xl border bg-card overflow-hidden shadow-sm"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                {/* Module header */}
                <button
                  onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  {mod.cover_url ? (
                    <img src={mod.cover_url} alt={mod.title} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <BookOpen className="h-5 w-5" style={{ color }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm">Módulo {i + 1}: {mod.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mod.lessons.length} {mod.lessons.length === 1 ? "aula" : "aulas"}
                    </p>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${
                      expandedModule === mod.id ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {/* Lessons list */}
                {expandedModule === mod.id && mod.lessons.length > 0 && (
                  <div className="border-t">
                    {mod.lessons.map((lesson, j) => (
                      <button
                        key={lesson.id}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b last:border-b-0"
                      >
                        <div
                          className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: `${color}12` }}
                        >
                          <span className="text-xs font-bold" style={{ color }}>{j + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {getContentIcon(lesson.content_type)}
                            <span className="text-xs text-muted-foreground capitalize">{lesson.content_type}</span>
                            {lesson.duration_minutes && (
                              <>
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{lesson.duration_minutes} min</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Lock className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {expandedModule === mod.id && mod.lessons.length === 0 && (
                  <div className="border-t px-4 py-6 text-center">
                    <p className="text-xs text-muted-foreground">Aulas em breve</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProduct;
