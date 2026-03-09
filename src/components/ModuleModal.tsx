import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const contentTypes = [
  { value: "video", label: "🎬 YouTube / Vimeo" },
  { value: "vturb", label: "📺 Vturb / Panda / VSL Play" },
  { value: "pdf", label: "📄 Arquivo Incorporado (PDF/DOC/PPT)" },
  { value: "download", label: "📥 Arquivo para Download" },
  { value: "audio", label: "🎵 Áudio (MP3)" },
  { value: "text", label: "✏️ Editor de Texto (Rich Text)" },
  { value: "html", label: "🧩 HTML (código embed)" },
  { value: "link", label: "🔗 Link Externo" },
  { value: "iframe", label: "🌐 Página Web (iframe)" },
  { value: "pdf_drive", label: "📁 PDF Google Drive" },
];

const releaseTypes = [
  { value: "immediate", label: "Imediato" },
  { value: "days_after", label: "Dias após compra" },
  { value: "exact_date", label: "Data exata" },
];

const ModuleModal = ({ open, onOpenChange, productId, userId, onModuleCreated, existingModule }: ModuleModalProps) => {
  const [title, setTitle] = useState(existingModule?.title || "");
  const [description, setDescription] = useState(existingModule?.description || "");
  const [contentType, setContentType] = useState(existingModule?.content_type || "video");
  const [contentUrl, setContentUrl] = useState(existingModule?.content_url || "");
  const [contentHtml, setContentHtml] = useState(existingModule?.content_html || "");
  const [releaseType, setReleaseType] = useState(existingModule?.release_type || "immediate");
  const [releaseValue, setReleaseValue] = useState(existingModule?.release_value || "");
  const [sortOrder, setSortOrder] = useState(existingModule?.sort_order?.toString() || "0");
  const [openDirectly, setOpenDirectly] = useState(existingModule?.open_directly || false);
  const [coverUrl, setCoverUrl] = useState<string | null>(existingModule?.cover_url || null);
  const [saving, setSaving] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/modules/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("app-assets").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("app-assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, "covers");
      setCoverUrl(url);
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    }
  };

  const handleContentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, "content");
      setContentUrl(url);
      toast({ title: "Arquivo enviado!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    }
  };

  const needsUrl = ["video", "link", "iframe", "pdf_drive", "vturb"].includes(contentType);
  const needsHtml = ["html", "vturb"].includes(contentType);
  const needsUpload = ["pdf", "download", "audio"].includes(contentType);
  const needsText = contentType === "text";

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
        content_type: contentType,
        content_url: contentUrl || null,
        content_html: contentHtml || null,
        release_type: releaseType,
        release_value: releaseValue || null,
        sort_order: parseInt(sortOrder) || 0,
        open_directly: openDirectly,
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
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            {existingModule ? "Editar Módulo" : "Novo Módulo"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label>Nome do Módulo</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Módulo 1 — Introdução" />
          </div>

          {/* Cover */}
          <div className="space-y-2">
            <Label>Capa do Módulo (450×800)</Label>
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
          </div>

          {/* Content type */}
          <div className="space-y-2">
            <Label>Formato do Conteúdo</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {contentTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* URL input */}
          {needsUrl && (
            <div className="space-y-2">
              <Label>
                {contentType === "video" ? "URL do YouTube ou Vimeo" :
                 contentType === "link" ? "URL do Link" :
                 contentType === "iframe" ? "URL da Página" :
                 contentType === "pdf_drive" ? "Link do Google Drive" :
                 "URL do Embed"}
              </Label>
              <Input value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} placeholder="https://..." />
            </div>
          )}

          {/* HTML/Embed code */}
          {needsHtml && (
            <div className="space-y-2">
              <Label>Código Embed / HTML</Label>
              <Textarea value={contentHtml} onChange={(e) => setContentHtml(e.target.value)} placeholder="Cole o código aqui..." rows={4} className="font-mono text-xs" />
            </div>
          )}

          {/* File upload */}
          {needsUpload && (
            <div className="space-y-2">
              <Label>
                {contentType === "pdf" ? "Arquivo (PDF, DOC, PPT)" :
                 contentType === "audio" ? "Arquivo de Áudio (MP3)" :
                 "Arquivo para Download"}
              </Label>
              <input type="file" ref={fileRef} className="hidden" onChange={handleContentUpload}
                accept={contentType === "audio" ? "audio/*" : contentType === "pdf" ? ".pdf,.doc,.docx,.ppt,.pptx" : "*"}
              />
              <Button variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" />
                {contentUrl ? "Arquivo enviado ✓" : "Selecionar Arquivo"}
              </Button>
              {contentUrl && (
                <p className="text-xs text-muted-foreground truncate">{contentUrl}</p>
              )}
            </div>
          )}

          {/* Rich text */}
          {needsText && (
            <div className="space-y-2">
              <Label>Conteúdo em Texto</Label>
              <Textarea value={contentHtml} onChange={(e) => setContentHtml(e.target.value)} placeholder="Escreva o conteúdo aqui..." rows={6} />
            </div>
          )}

          {/* Release */}
          <div className="space-y-2">
            <Label>Quando liberar?</Label>
            <Select value={releaseType} onValueChange={setReleaseType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {releaseTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {releaseType !== "immediate" && (
            <div className="space-y-2">
              <Label>{releaseType === "days_after" ? "Dias após compra" : "Data de liberação"}</Label>
              <Input
                type={releaseType === "exact_date" ? "date" : "number"}
                value={releaseValue}
                onChange={(e) => setReleaseValue(e.target.value)}
              />
            </div>
          )}

          {/* Order */}
          <div className="space-y-2">
            <Label>Ordem de exibição</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" />
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between">
            <Label htmlFor="open-directly">Abrir conteúdo diretamente?</Label>
            <Switch id="open-directly" checked={openDirectly} onCheckedChange={setOpenDirectly} />
          </div>

          {/* Actions */}
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
