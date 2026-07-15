import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Play, FileText, Music, Video, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getContentUrl } from "@/lib/content-url";
import { getClientSession } from "@/lib/client-session";

interface Product {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  content_type: string;
  content_url: string | null;
  content_html: string | null;
  open_directly: boolean;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content_type: string;
  content_url: string | null;
  content_text: string | null;
  duration_minutes: number | null;
}

const ContentPlayer = ({ type, url, text }: { type: string; url?: string | null; text?: string | null }) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (url) {
      getContentUrl(url).then(setResolvedUrl);
    } else {
      setResolvedUrl(null);
    }
  }, [url]);

  if (!resolvedUrl && !text) return null;

  if (type === "video" && resolvedUrl) {
    return (
      <div className="rounded-xl overflow-hidden bg-black aspect-video">
        <video controls className="w-full h-full" src={resolvedUrl} />
      </div>
    );
  }

  if (type === "pdf" && resolvedUrl) {
    return (
      <div className="rounded-xl overflow-hidden border border-border bg-card">
        <iframe src={resolvedUrl} className="w-full h-[70vh]" title="PDF Viewer" />
      </div>
    );
  }

  if (type === "audio" && resolvedUrl) {
    return (
      <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
        <Music className="h-6 w-6 text-primary flex-shrink-0" />
        <audio controls className="w-full" src={resolvedUrl} />
      </div>
    );
  }

  if (type === "text" && text) {
    return (
      <div className="rounded-xl bg-card border border-border p-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: text }} />
    );
  }

  if (resolvedUrl) {
    return (
      <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary underline">
        <FileText className="h-4 w-4" /> Abrir arquivo
      </a>
    );
  }

  return null;
};

const typeIcon = (t: string) => {
  if (t === "video") return <Video className="h-4 w-4" />;
  if (t === "audio") return <Music className="h-4 w-4" />;
  if (t === "pdf") return <FileText className="h-4 w-4" />;
  return <Play className="h-4 w-4" />;
};

const VivaBemProduct = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    const fetch = async () => {
      setLoading(true);

      // Access guard: if product is in a premium section, require a paid purchase
      const { data: prod } = await supabase
        .from("products")
        .select("id, name, description, cover_url, section_id")
        .eq("id", productId)
        .single();

      if (prod?.section_id) {
        const { data: sec } = await supabase
          .from("sections")
          .select("is_premium")
          .eq("id", prod.section_id)
          .maybeSingle();
        if (sec?.is_premium) {
          const client = getClientSession();
          let allowed = false;
          if (client) {
            const { data } = await supabase.functions.invoke("list-purchases", {
              body: { clientId: client.id, productId },
            });
            const ids: string[] = (data as any)?.productIds ?? [];
            allowed = ids.includes(productId);
          }
          if (!allowed) {
            navigate("/home");
            return;
          }
        }
      }

      const [pRes, mRes] = await Promise.all([
        supabase.from("products").select("id, name, description, cover_url").eq("id", productId).single(),
        supabase.from("modules").select("*").eq("product_id", productId).eq("is_published", true).order("sort_order"),
      ]);
      setProduct(pRes.data);
      const mods = (mRes.data || []) as Module[];
      setModules(mods);

      if (mods.length > 0) {
        const { data: lData } = await supabase
          .from("lessons")
          .select("*")
          .in("module_id", mods.map((m) => m.id))
          .eq("is_published", true)
          .order("sort_order");
        setLessons((lData || []) as Lesson[]);
        setExpandedModule(mods[0].id);
      }
      setLoading(false);
    };
    fetch();
  }, [productId]);


  const lessonsForModule = (moduleId: string) => lessons.filter((l) => l.module_id === moduleId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Produto não encontrado</p>
        <button onClick={() => navigate("/home")} className="text-primary underline">Voltar</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-48 bg-muted bg-cover bg-center" style={product.cover_url ? { backgroundImage: `url(${product.cover_url})` } : undefined}>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <button onClick={() => navigate("/home")} className="absolute top-4 left-4 z-10 h-9 w-9 rounded-full bg-background/80 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
      </div>

      <div className="px-6 -mt-8 relative z-10">
        <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
        {product.description && <p className="text-sm text-muted-foreground mt-1">{product.description}</p>}
      </div>

      {/* Active lesson player */}
      <AnimatePresence>
        {activeLesson && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-6 mt-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">{activeLesson.title}</h3>
            <ContentPlayer type={activeLesson.content_type} url={activeLesson.content_url} text={activeLesson.content_text} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modules accordion */}
      <div className="px-6 mt-8 pb-12 space-y-3">
        {modules.map((mod) => {
          const modLessons = lessonsForModule(mod.id);
          const isOpen = expandedModule === mod.id;

          // If module has open_directly and content, show it directly
          if (mod.open_directly && (mod.content_url || mod.content_html)) {
            return (
              <div key={mod.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <button onClick={() => setExpandedModule(isOpen ? null : mod.id)} className="w-full flex items-center justify-between p-4">
                  <span className="font-medium text-foreground">{mod.title}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="p-4 pt-0">
                        <ContentPlayer type={mod.content_type} url={mod.content_url} text={mod.content_html} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <div key={mod.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button onClick={() => setExpandedModule(isOpen ? null : mod.id)} className="w-full flex items-center justify-between p-4">
                <span className="font-medium text-foreground">{mod.title}</span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs">{modLessons.length} aula{modLessons.length !== 1 ? "s" : ""}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>
              <AnimatePresence>
                {isOpen && modLessons.length > 0 && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-2">
                      {modLessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => setActiveLesson(lesson)}
                          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                            activeLesson?.id === lesson.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                          }`}
                        >
                          {typeIcon(lesson.content_type)}
                          <span className="flex-1 text-left">{lesson.title}</span>
                          {lesson.duration_minutes && <span className="text-xs text-muted-foreground">{lesson.duration_minutes}min</span>}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {modules.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum módulo disponível ainda.</p>
        )}
      </div>
    </div>
  );
};

export default VivaBemProduct;
