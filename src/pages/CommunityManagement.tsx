import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, MessageCircle, Send, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string | null;
}

const CommunityManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newPost, setNewPost] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("community_posts")
      .select("id, content, created_at, user_id")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setPosts(data || []);
    setLoading(false);
  };

  const deletePost = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("community_posts").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== deleteId));
      toast({ title: "Post excluído" });
    }
    setDeleteId(null);
  };

  const handleNewPost = async () => {
    if (!newPost.trim() || !user) return;
    setSending(true);
    const { error } = await supabase
      .from("community_posts")
      .insert({ content: newPost.trim(), user_id: user.id });
    if (error) {
      toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" });
    } else {
      setNewPost("");
      fetchPosts();
      toast({ title: "Post publicado!" });
    }
    setSending(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-foreground">Comunidade</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        {/* New post as admin */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-6 shadow-sm">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Publicar como administrador</p>
          <Textarea
            placeholder="Escreva algo para a comunidade..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="mb-3 resize-none bg-background border-border"
            rows={3}
          />
          <div className="flex justify-end">
            <Button onClick={handleNewPost} disabled={sending || !newPost.trim()} size="sm" className="gap-2">
              <Send className="h-4 w-4" />
              Publicar
            </Button>
          </div>
        </div>

        {/* Posts list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold text-foreground">Nenhum post</h2>
            <p className="mt-2 text-muted-foreground">Seja o primeiro a publicar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{post.client_email || "Membro"}</p>
                        {post.user_id && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Admin</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap mt-1">{post.content}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteId(post.id)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir post?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={deletePost}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityManagement;
