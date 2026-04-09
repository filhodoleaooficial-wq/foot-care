import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Plus, GripVertical, Trash2, Save, Crown } from "lucide-react";

interface Section {
  id: string;
  title: string;
  sort_order: number;
  is_premium: boolean;
  is_active: boolean;
}

const SectionsManagement = () => {
  const { appId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    fetchSections();
  }, [appId]);

  const fetchSections = async () => {
    const { data, error } = await supabase
      .from("sections")
      .select("id, title, sort_order, is_premium, is_active")
      .eq("app_id", appId!)
      .order("sort_order");
    if (error) {
      toast.error("Erro ao carregar seções");
    } else {
      setSections(data || []);
    }
    setLoading(false);
  };

  const addSection = async () => {
    if (!newTitle.trim()) return;
    const { data, error } = await supabase
      .from("sections")
      .insert({
        app_id: appId!,
        user_id: user!.id,
        title: newTitle.trim(),
        sort_order: sections.length,
      })
      .select("id, title, sort_order, is_premium, is_active")
      .single();
    if (error) {
      toast.error("Erro ao criar seção: " + error.message);
    } else if (data) {
      setSections((prev) => [...prev, data]);
      setNewTitle("");
      toast.success("Seção criada!");
    }
  };

  const updateSection = async (id: string, updates: Partial<Section>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const section of sections) {
        const { error } = await supabase
          .from("sections")
          .update({
            title: section.title,
            sort_order: section.sort_order,
            is_premium: section.is_premium,
            is_active: section.is_active,
          })
          .eq("id", section.id);
        if (error) throw error;
      }
      toast.success("Seções salvas!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = async (id: string) => {
    const { error } = await supabase.from("sections").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      setSections((prev) => prev.filter((s) => s.id !== id));
      toast.success("Seção excluída");
    }
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((s, i) => (s.sort_order = i));
    setSections(updated);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur-md px-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Gerenciar Seções</h1>
        <div className="ml-auto">
          <Button variant="hero" size="sm" className="gap-1.5" onClick={saveAll} disabled={saving}>
            <Save className="h-3.5 w-3.5" />
            {saving ? "Salvando..." : "Salvar Tudo"}
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        {/* Add section */}
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Nome da nova seção..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSection()}
          />
          <Button variant="hero" size="sm" className="gap-1.5 shrink-0" onClick={addSection}>
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>

        {/* Sections list */}
        {sections.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Nenhuma seção criada. Adicione uma acima.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm"
              >
                {/* Reorder */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveSection(index, -1)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <GripVertical className="h-4 w-4 rotate-90 scale-x-[-1]" />
                  </button>
                  <button
                    onClick={() => moveSection(index, 1)}
                    disabled={index === sections.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <GripVertical className="h-4 w-4 rotate-90" />
                  </button>
                </div>

                {/* Title */}
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                  className="flex-1"
                />

                {/* Premium toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <Crown className={`h-4 w-4 ${section.is_premium ? "text-yellow-500" : "text-muted-foreground/40"}`} />
                  <Switch
                    checked={section.is_premium}
                    onCheckedChange={(checked) => updateSection(section.id, { is_premium: checked })}
                  />
                  <span className="text-xs text-muted-foreground w-14">
                    {section.is_premium ? "Premium" : "Grátis"}
                  </span>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={section.is_active}
                    onCheckedChange={(checked) => updateSection(section.id, { is_active: checked })}
                  />
                  <span className="text-xs text-muted-foreground w-10">
                    {section.is_active ? "Ativo" : "Oculto"}
                  </span>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteSection(section.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          💡 Após criar as seções, vá em <strong>Produtos</strong> e vincule cada produto à seção desejada.
        </p>
      </div>
    </div>
  );
};

export default SectionsManagement;
