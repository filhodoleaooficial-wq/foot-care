import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ModuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  userId: string;
  onModuleCreated: () => void;
  existingModule?: any;
}

const ModuleModal = ({ open, onOpenChange, productId, userId, onModuleCreated, existingModule }: ModuleModalProps) => {
  const [title, setTitle] = useState(existingModule?.title || "");
  const [description, setDescription] = useState(existingModule?.description || "");
  const [sortOrder, setSortOrder] = useState(existingModule?.sort_order?.toString() || "0");
  const [coverUrl, setCoverUrl] = useState<string | null>(existingModule?.cover_url || null);
  const [saving, setSaving] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadCover = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/modules/covers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("app-assets").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("app-assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadCover(file);
      setCoverUrl(url);
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        product_id: productId,
        user_id: userId,
        title: title.trim(),
        description: description || null,
        sort_order: parseInt(sortOrder) || 0,
        cover_url: coverUrl,
      };

      if (existingModule) {
        const { error } = await supabase.from("modules").update(payload).eq("id", existingModule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("modules").insert(payload);
        if (error) throw error;
      }
      toast({ title: existingModule ? "Módulo atualizado!" : "Módulo criado!" });
      onModuleCreated();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            {existingModule ? "Editar Módulo" : "Novo Módulo"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label>Nome do Módulo</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Módulo 1 — Introdução" />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição do módulo..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Capa do Módulo</Label>
            <input type="file" ref={coverRef} accept="image/*" className="hidden" onChange={handleCoverUpload} />
            <div
              onClick={() => coverRef.current?.click()}
              className="flex h-28 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-accent/30 hover:border-primary/60 overflow-hidden transition-colors"
            >
              {coverUrl ? (
                <img src={coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Upload capa</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Tamanho ideal: 450×800px</p>
          </div>

          <div className="space-y-2">
            <Label>Ordem de exibição</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button variant="hero" className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : existingModule ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleModal;
