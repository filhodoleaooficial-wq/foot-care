import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, FileText, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BlogArticle {
  id: string;
  title: string;
  description: string | null;
  content_html: string | null;
  cover_url: string | null;
  is_published: boolean;
  created_at: string;
}

const BlogManagement = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlogArticle | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (appId) fetchArticles();
  }, [appId]);

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("modules")
      .select("id, title, description, content_html, cover_url, is_published, created_at")
      .eq("content_type", "text")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setArticles((data || []) as BlogArticle[]);
    setLoading(false);
  };

  const togglePublish = async (article: BlogArticle) => {
    const { error } = await supabase
      .from("modules")
      .update({ is_published: !article.is_published })
      .eq("id", article.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, is_published: !a.is_published } : a))
      );
    }
  };

  const deleteArticle = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("modules").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      setArticles((prev) => prev.filter((a) => a.id !== deleteId));
      toast({ title: "Artigo excluído" });
    }
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-foreground">Blog</h1>
          </div>
          <Button variant="hero" className="gap-2" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Novo Artigo
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold text-foreground">Nenhum artigo</h2>
            <p className="mt-2 text-muted-foreground">Crie o primeiro artigo do blog.</p>
            <Button variant="hero" className="mt-6 gap-2" onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus className="h-4 w-4" /> Criar Artigo
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <div key={article.id} className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
                {article.cover_url ? (
                  <img src={article.cover_url} alt="" className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground truncate">{article.title}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${article.is_published ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {article.is_published ? "Publicado" : "Rascunho"}
                    </span>
                  </div>
                  {article.description && <p className="text-sm text-muted-foreground truncate mt-0.5">{article.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => togglePublish(article)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors" title={article.is_published ? "Despublicar" : "Publicar"}>
                    {article.is_published ? "🟢" : "⚪"}
                  </button>
                  <button onClick={() => { setEditing(article); setModalOpen(true); }} className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(article.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <BlogArticleModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          appId={appId!}
          userId={user!.id}
          existing={editing}
          onSaved={() => { fetchArticles(); setModalOpen(false); }}
        />
      )}

      {deleteId && (
        <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir artigo?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 justify-end mt-4">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={deleteArticle}>Excluir</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

/* ─── Modal ─── */
interface ModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appId: string;
  userId: string;
  existing: BlogArticle | null;
  onSaved: () => void;
}

const BlogArticleModal = ({ open, onOpenChange, appId, userId, existing, onSaved }: ModalProps) => {
  const [title, setTitle] = useState(existing?.title || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [contentHtml, setContentHtml] = useState(existing?.content_html || "");
  const [coverUrl, setCoverUrl] = useState<string | null>(existing?.cover_url || null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/blog/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("app-assets").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("app-assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        app_id: appId,
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        content_html: contentHtml || null,
        content_type: "text",
        cover_url: coverUrl,
        is_published: true,
      };

      if (existing) {
        const { error } = await supabase.from("modules").update(payload as any).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("modules").insert(payload as any);
        if (error) throw error;
      }
      toast({ title: existing ? "Artigo atualizado!" : "Artigo criado!" });
      onSaved();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setCoverUrl(url);
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (open && existing) {
      setTitle(existing.title || "");
      setDescription(existing.description || "");
      setContentHtml(existing.content_html || "");
      setCoverUrl(existing.cover_url || null);
    } else if (open) {
      setTitle("");
      setDescription("");
      setContentHtml("");
      setCoverUrl(null);
    }
  }, [open, existing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Editar Artigo" : "Novo Artigo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do artigo" />
          </div>
          <div className="space-y-2">
            <Label>Descrição (resumo)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição" />
          </div>
          <div className="space-y-2">
            <Label>Conteúdo (HTML)</Label>
            <Textarea
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
              placeholder="<p>Escreva o conteúdo aqui...</p>"
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Capa</Label>
            <input type="file" accept="image/*" className="hidden" id="blog-cover" onChange={handleCoverUpload} />
            <label htmlFor="blog-cover" className="flex h-28 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-accent/30 hover:border-primary/60 overflow-hidden transition-colors">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center">
                  <Upload className="h-5 w-5 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground mt-1">Enviar imagem</p>
                </div>
              )}
            </label>
            <p className="text-xs text-muted-foreground">Tamanho ideal: 1200×630px (formato paisagem)</p>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button variant="hero" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : existing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogManagement;
