import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, BookOpen, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LessonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  userId: string;
  onLessonCreated: () => void;
  existingLesson?: any;
}

const contentTypes = [
  { value: "video", label: "🎬 YouTube / Vimeo" },
  { value: "vturb", label: "📺 Vturb / Panda / VSL Play" },
  { value: "pdf", label: "📄 Arquivo Incorporado (PDF/DOC/PPT)" },
  { value: "download", label: "📥 Arquivo para Download (ZIP, etc)" },
  { value: "audio", label: "🎵 Áudio (MP3)" },
  { value: "text", label: "✏️ Texto (Rich Text)" },
  { value: "html", label: "🧩 HTML (código embed)" },
  { value: "link", label: "🔗 Link Externo" },
  { value: "iframe", label: "🌐 Página Web (iframe)" },
];

const LessonModal = ({ open, onOpenChange, moduleId, userId, onLessonCreated, existingLesson }: LessonModalProps) => {
  const [title, setTitle] = useState(existingLesson?.title || "");
  const [contentType, setContentType] = useState(existingLesson?.content_type || "video");
  const [contentUrl, setContentUrl] = useState(existingLesson?.content_url || "");
  const [contentText, setContentText] = useState(existingLesson?.content_text || "");
  const [durationMinutes, setDurationMinutes] = useState(existingLesson?.duration_minutes?.toString() || "");
  const [sortOrder, setSortOrder] = useState(existingLesson?.sort_order?.toString() || "0");
  const [isPublished, setIsPublished] = useState(existingLesson?.is_published ?? true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const toEmbedUrl = (url: string): string => {
    if (!url) return "";
    // YouTube
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    // Vimeo
    const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
    return url;
  };

  const renderPreview = () => {
    if (["video", "vturb", "iframe"].includes(contentType)) {
      if (!contentUrl) return <p className="text-xs text-muted-foreground">Cole uma URL para visualizar.</p>;
      return (
        <div className="aspect-video w-full overflow-hidden rounded-md border bg-black">
          <iframe
            src={toEmbedUrl(contentUrl)}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    if (contentType === "pdf") {
      if (!contentUrl) return <p className="text-xs text-muted-foreground">Envie um arquivo para visualizar.</p>;
      return <iframe src={contentUrl} className="h-80 w-full rounded-md border bg-white" />;
    }
    if (contentType === "audio") {
      if (!contentUrl) return <p className="text-xs text-muted-foreground">Envie um áudio para ouvir.</p>;
      return <audio src={contentUrl} controls className="w-full" />;
    }
    if (contentType === "download") {
      if (!contentUrl) return <p className="text-xs text-muted-foreground">Envie um arquivo.</p>;
      return (
        <a href={contentUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline break-all">
          ⬇️ Baixar arquivo
        </a>
      );
    }
    if (contentType === "link") {
      if (!contentUrl) return <p className="text-xs text-muted-foreground">Cole um link.</p>;
      return (
        <a href={contentUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline break-all">
          {contentUrl} ↗
        </a>
      );
    }
    if (contentType === "html") {
      if (!contentText) return <p className="text-xs text-muted-foreground">Cole o código HTML.</p>;
      return (
        <div
          className="rounded-md border bg-background p-3 text-sm"
          dangerouslySetInnerHTML={{ __html: contentText }}
        />
      );
    }
    if (contentType === "text") {
      if (!contentText) return <p className="text-xs text-muted-foreground">Escreva o conteúdo.</p>;
      return (
        <div className="rounded-md border bg-background p-3 text-sm whitespace-pre-wrap">
          {contentText}
        </div>
      );
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/lessons/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("content-files").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("content-files").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setContentUrl(url);
      toast({ title: "Arquivo enviado!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    }
  };

  const needsUrl = ["video", "vturb", "link", "iframe"].includes(contentType);
  const needsUpload = ["pdf", "download", "audio"].includes(contentType);
  const needsText = ["text", "html"].includes(contentType);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        module_id: moduleId,
        user_id: userId,
        title: title.trim(),
        content_type: contentType,
        content_url: contentUrl || null,
        content_text: contentText || null,
        duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
        sort_order: parseInt(sortOrder) || 0,
        is_published: isPublished,
      };

      if (existingLesson) {
        const { error } = await supabase.from("lessons").update(payload).eq("id", existingLesson.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lessons").insert(payload);
        if (error) throw error;
      }
      toast({ title: existingLesson ? "Aula atualizada!" : "Aula criada!" });
      onLessonCreated();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const acceptMap: Record<string, string> = {
    pdf: ".pdf,.doc,.docx,.ppt,.pptx",
    audio: "audio/*",
    download: "*",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {existingLesson ? "Editar Aula" : "Nova Aula"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label>Título da Aula</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Aula 1 — Introdução" />
          </div>

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

          {needsUrl && (
            <div className="space-y-2">
              <Label>
                {contentType === "video" ? "URL do YouTube ou Vimeo" :
                 contentType === "vturb" ? "URL do Embed (Vturb/Panda)" :
                 contentType === "link" ? "URL do Link" : "URL da Página"}
              </Label>
              <Input value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} placeholder="https://..." />
            </div>
          )}

          {needsUpload && (
            <div className="space-y-2">
              <Label>
                {contentType === "pdf" ? "Arquivo (PDF, DOC, PPT)" :
                 contentType === "audio" ? "Arquivo de Áudio (MP3)" :
                 "Arquivo para Download (ZIP, RAR, etc)"}
              </Label>
              <input type="file" ref={fileRef} className="hidden" onChange={handleFileUpload} accept={acceptMap[contentType] || "*"} />
              <Button variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" />
                {contentUrl ? "Arquivo enviado ✓" : "Selecionar Arquivo"}
              </Button>
              {contentUrl && <p className="text-xs text-muted-foreground truncate">{contentUrl}</p>}
              <p className="text-xs text-muted-foreground">Máximo: 500MB</p>
            </div>
          )}

          {needsText && (
            <div className="space-y-2">
              <Label>{contentType === "html" ? "Código HTML / Embed" : "Conteúdo em Texto"}</Label>
              <Textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                placeholder={contentType === "html" ? "Cole o código aqui..." : "Escreva o conteúdo aqui..."}
                rows={6}
                className={contentType === "html" ? "font-mono text-xs" : ""}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Duração (minutos)</Label>
            <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="Ex: 15" />
          </div>

          <div className="space-y-2">
            <Label>Ordem de exibição</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="lesson-published">Publicada?</Label>
            <Switch id="lesson-published" checked={isPublished} onCheckedChange={setIsPublished} />
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setShowPreview((v) => !v)}
            >
              <Eye className="h-4 w-4" />
              {showPreview ? "Ocultar pré-visualização" : "Pré-visualizar conteúdo"}
            </Button>
            {showPreview && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Pré-visualização</p>
                {renderPreview()}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Fechar</Button>
            <Button variant="hero" className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : existingLesson ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonModal;
