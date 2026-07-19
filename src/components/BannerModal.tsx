import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apps: { id: string; name: string }[];
  userId: string;
  onBannerSaved: () => void;
  existingBanner?: {
    id: string;
    app_id: string;
    image_url: string;
    link_url: string | null;
    is_active: boolean;
    sort_order: number;
  } | null;
}

const BannerModal = ({ open, onOpenChange, apps, userId, onBannerSaved, existingBanner }: BannerModalProps) => {
  const [appId, setAppId] = useState(existingBanner?.app_id || "");
  const [imageUrl, setImageUrl] = useState(existingBanner?.image_url || "");
  const [linkUrl, setLinkUrl] = useState(existingBanner?.link_url || "");
  const [isActive, setIsActive] = useState(existingBanner?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(existingBanner?.sort_order?.toString() || "0");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    if (existingBanner) {
      setAppId(existingBanner.app_id);
      setImageUrl(existingBanner.image_url);
      setLinkUrl(existingBanner.link_url || "");
      setIsActive(existingBanner.is_active);
      setSortOrder(existingBanner.sort_order?.toString() || "0");
    } else {
      setAppId(apps[0]?.id || "");
      setImageUrl("");
      setLinkUrl("");
      setIsActive(true);
      setSortOrder("0");
    }
  }, [open, existingBanner, apps]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `${userId}/banners/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("app-assets").upload(path, file);
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      return;
    }
    const { data } = supabase.storage.from("app-assets").getPublicUrl(path);
    setImageUrl(data.publicUrl);
  };

  const handleSave = async () => {
    if (!appId || !imageUrl) {
      toast({ title: "Preencha os campos", description: "Imagem e aplicativo são obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      app_id: appId,
      image_url: imageUrl,
      link_url: linkUrl || null,
      is_active: isActive,
      sort_order: parseInt(sortOrder) || 0,
    };

    if (existingBanner) {
      const { error } = await supabase.from("banners").update(payload).eq("id", existingBanner.id);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Banner atualizado!" });
        onBannerSaved();
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase.from("banners").insert({ ...payload, user_id: userId });
      if (error) {
        toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Banner criado!" });
        onBannerSaved();
        onOpenChange(false);
      }
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingBanner ? "Editar Banner" : "Novo Banner"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Aplicativo</Label>
            <Select value={appId} onValueChange={setAppId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o app" />
              </SelectTrigger>
              <SelectContent>
                {apps.map((app) => (
                  <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Imagem do Banner</Label>
            <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleUpload} />
            <div
              onClick={() => fileRef.current?.click()}
              className="mt-1 border-2 border-dashed rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors text-center"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Banner" className="w-full h-32 object-cover rounded-lg" />
              ) : (
                <div className="py-4">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-1">Clique para enviar imagem</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tamanho ideal: 1200×400px (formato paisagem)</p>
          </div>

          <div>
            <Label>Link (opcional)</Label>
            <Input
              className="mt-1"
              placeholder="https://exemplo.com/pagina"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Ativo</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div>
            <Label>Ordem</Label>
            <Input
              className="mt-1"
              type="number"
              min="0"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>

          <Button variant="hero" className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : existingBanner ? "Salvar Alterações" : "Criar Banner"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BannerModal;
