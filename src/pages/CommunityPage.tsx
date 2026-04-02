import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, MessageCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Post {
  id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  display_name?: string;
}

const CommunityPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("community_posts")
      .select("id, content, created_at, user_id")
      .order("created_at", { ascending: false });
    
    if (!data) { setPosts([]); return; }
    
    // Fetch display names from profiles for post authors
    const userIds = [...new Set(data.map(p => p.user_id).filter(Boolean))];
    let profileMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      if (profiles) {
        profiles.forEach(p => {
          profileMap[p.user_id] = p.full_name || p.email?.split("@")[0] || "Membro";
        });
      }
    }
    
    setPosts(data.map(p => ({
      ...p,
      display_name: p.user_id ? (profileMap[p.user_id] || "Membro") : "Membro",
    })) as Post[]);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async () => {
    if (!newPost.trim() || !user) {
      toast.error("Escreva algo para publicar.");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("community_posts")
      .insert({ client_email: user.email || "", content: newPost.trim(), user_id: user.id });
    if (error) {
      toast.error("Erro ao publicar.");
    } else {
      setNewPost("");
      fetchPosts();
      toast.success("Publicado!");
    }
    setLoading(false);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-primary" />
        Comunidade
      </h1>

      {/* New post */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-8 shadow-sm">
        <Textarea
          placeholder="Compartilhe sua experiência..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          className="mb-3 resize-none bg-background border-border"
          rows={3}
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={loading} size="sm" className="gap-2">
            <Send className="h-4 w-4" />
            Publicar
          </Button>
        </div>
      </div>

      {/* Posts feed */}
      <div className="space-y-4">
        {posts.length === 0 && (
          <p className="text-muted-foreground text-center py-10">
            Nenhuma publicação ainda. Seja a primeira!
          </p>
        )}
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {post.client_email.split("@")[0]}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
              </div>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;
