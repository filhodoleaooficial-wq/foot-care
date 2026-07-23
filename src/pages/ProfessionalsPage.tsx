import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock, MessageCircle, MapPin, Instagram, Globe, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { useAppConfig } from "@/contexts/AppConfigContext";

interface Professional {
  id: string;
  name: string;
  category: "fisica" | "mental" | "espiritual";
  activity: string;
  bio: string | null;
  photo_url: string | null;
  whatsapp: string;
  city: string | null;
  state: string | null;
  address: string | null;
  instagram: string | null;
  website: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  fisica: "Saúde Física",
  mental: "Saúde Mental",
  espiritual: "Saúde Espiritual",
};

const FILTERS = [
  { value: "all", label: "Todos" },
  { value: "fisica", label: "Física" },
  { value: "mental", label: "Mental" },
  { value: "espiritual", label: "Espiritual" },
];

const ProfessionalsPage = () => {
  const navigate = useNavigate();
  const { loading: gateLoading, isPremium } = usePremiumGate();
  const { app } = useAppConfig();
  const accent = app?.primary_color || "hsl(var(--vivabem-green))";

  const [items, setItems] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isPremium) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setItems(data as Professional[]);
      setLoading(false);
    })();
  }, [isPremium]);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (filter !== "all" && p.category !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.activity.toLowerCase().includes(q) ||
          (p.city || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, filter, query]);

  if (gateLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Área exclusiva</h1>
        <p className="text-muted-foreground mb-6">
          O diretório de profissionais é acessível somente para membros premium.
        </p>
        <button
          onClick={() => navigate("/home")}
          className="px-6 py-2.5 rounded-full text-white font-medium"
          style={{ backgroundColor: accent }}
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  const openWhatsapp = (num: string, name: string) => {
    const digits = num.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá ${name}, encontrei seu contato no app.`);
    window.open(`https://wa.me/${digits}?text=${msg}`, "_blank");
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profissionais</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Encontre profissionais de saúde física, mental e espiritual.
          </p>
        </div>
        <button
          onClick={() => navigate("/profissionais/cadastro")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium"
          style={{ backgroundColor: accent }}
        >
          <Plus className="h-4 w-4" /> Cadastre-se
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
              filter === f.value ? "text-white border-transparent" : "text-foreground hover:bg-muted"
            }`}
            style={filter === f.value ? { backgroundColor: accent } : undefined}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, atividade ou cidade..."
          className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          Nenhum profissional encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-5 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-14 w-14 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{p.activity}</p>
                  <span
                    className="inline-block mt-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: accent }}
                  >
                    {CATEGORY_LABELS[p.category]}
                  </span>
                </div>
              </div>

              {p.bio && <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{p.bio}</p>}

              <div className="space-y-1 text-xs text-muted-foreground mb-4">
                {(p.city || p.state) && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{[p.city, p.state].filter(Boolean).join(" - ")}</span>
                  </div>
                )}
                {p.instagram && (
                  <a
                    href={`https://instagram.com/${p.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:text-foreground"
                  >
                    <Instagram className="h-3.5 w-3.5" /> {p.instagram}
                  </a>
                )}
                {p.website && (
                  <a
                    href={p.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:text-foreground truncate"
                  >
                    <Globe className="h-3.5 w-3.5" /> {p.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>

              <button
                onClick={() => openWhatsapp(p.whatsapp, p.name)}
                className="mt-auto w-full inline-flex items-center justify-center gap-2 py-2 rounded-full text-white text-sm font-medium bg-[#25D366] hover:bg-[#20bd59] transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfessionalsPage;
