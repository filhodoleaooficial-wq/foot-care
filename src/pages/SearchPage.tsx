import { useState } from "react";
import { Search, Package, BookOpen, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface SearchResult {
  id: string;
  title: string;
  type: "product" | "module" | "lesson";
}

const typeConfig = {
  product: { icon: Package, label: "Produto", color: "text-primary" },
  module: { icon: BookOpen, label: "Módulo", color: "text-accent-foreground" },
  lesson: { icon: Play, label: "Aula", color: "text-muted-foreground" },
};

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setSearched(true);
    const pattern = `%${q.trim()}%`;

    const [{ data: products }, { data: modules }, { data: lessons }] = await Promise.all([
      supabase
        .from("products")
        .select("id, name")
        .eq("is_published", true)
        .ilike("name", pattern)
        .limit(10),
      supabase
        .from("modules")
        .select("id, title")
        .eq("is_published", true)
        .ilike("title", pattern)
        .limit(10),
      supabase
        .from("lessons")
        .select("id, title")
        .eq("is_published", true)
        .ilike("title", pattern)
        .limit(10),
    ]);

    const all: SearchResult[] = [
      ...(products || []).map((p) => ({ id: p.id, title: p.name, type: "product" as const })),
      ...(modules || []).map((m) => ({ id: m.id, title: m.title, type: "module" as const })),
      ...(lessons || []).map((l) => ({ id: l.id, title: l.title, type: "lesson" as const })),
    ];
    setResults(all);
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Search className="h-6 w-6 text-primary" />
        Pesquisar
      </h1>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos, módulos, aulas..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </div>

      {searched && results.length === 0 && (
        <p className="text-muted-foreground text-center py-10">Nenhum resultado encontrado.</p>
      )}

      <div className="space-y-2">
        {results.map((r, i) => {
          const cfg = typeConfig[r.type];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={`${r.type}-${r.id}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 shadow-sm"
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchPage;
