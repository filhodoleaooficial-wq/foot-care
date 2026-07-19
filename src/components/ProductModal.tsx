import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Package, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: string;
  userId: string;
  onProductCreated: () => void;
  existingProduct?: any;
}

const offerTypes = [
  { value: "main", label: "Produto Principal" },
  { value: "order_bump", label: "Order Bump" },
  { value: "upsell", label: "Upsell / Downsell" },
  { value: "bonus", label: "Bônus" },
];

const releaseTypes = [
  { value: "immediate", label: "Imediato" },
  { value: "days_after", label: "Dias após compra" },
  { value: "exact_date", label: "Data exata" },
];

const ProductModal = ({ open, onOpenChange, appId, userId, onProductCreated, existingProduct }: ProductModalProps) => {
  const [name, setName] = useState(existingProduct?.name || "");
  const [price, setPrice] = useState(existingProduct?.price?.toString() || "");
  const [hiddenName, setHiddenName] = useState(existingProduct?.hidden_name || false);
  const [releaseType, setReleaseType] = useState(existingProduct?.release_type || "immediate");
  const [releaseValue, setReleaseValue] = useState(existingProduct?.release_value || "");
  const [offerType, setOfferType] = useState(existingProduct?.offer_type || "main");
  const [sectionId, setSectionId] = useState(existingProduct?.section_id || "");
  const [sortOrder, setSortOrder] = useState(existingProduct?.sort_order?.toString() || "0");
  const [columnCount, setColumnCount] = useState(existingProduct?.column_count?.toString() || "2");
  const [externalProductId, setExternalProductId] = useState(existingProduct?.external_product_id || "");
  const [redirectToSales, setRedirectToSales] = useState(existingProduct?.redirect_to_sales || false);
  const [salesPageUrl, setSalesPageUrl] = useState(existingProduct?.sales_page_url || "");
  const [logoUnlockedUrl, setLogoUnlockedUrl] = useState<string | null>(existingProduct?.logo_unlocked_url || null);
  const [logoLockedUrl, setLogoLockedUrl] = useState<string | null>(existingProduct?.logo_locked_url || null);
  const [coverUrl, setCoverUrl] = useState<string | null>(existingProduct?.cover_url || null);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<{ id: string; title: string }[]>([]);
  const unlockedRef = useRef<HTMLInputElement>(null);
  const lockedRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    if (existingProduct) {
      setName(existingProduct.name || "");
      setPrice(existingProduct.price?.toString() || "");
      setHiddenName(existingProduct.hidden_name || false);
      setReleaseType(existingProduct.release_type || "immediate");
      setReleaseValue(existingProduct.release_value || "");
      setOfferType(existingProduct.offer_type || "main");
      setSectionId(existingProduct.section_id || "");
      setSortOrder(existingProduct.sort_order?.toString() || "0");
      setColumnCount(existingProduct.column_count?.toString() || "2");
      setExternalProductId(existingProduct.external_product_id || "");
      setRedirectToSales(existingProduct.redirect_to_sales || false);
      setSalesPageUrl(existingProduct.sales_page_url || "");
      setLogoUnlockedUrl(existingProduct.logo_unlocked_url || null);
      setLogoLockedUrl(existingProduct.logo_locked_url || null);
      setCoverUrl(existingProduct.cover_url || null);
    } else {
      setName("");
      setPrice("");
      setHiddenName(false);
      setReleaseType("immediate");
      setReleaseValue("");
      setOfferType("main");
      setSectionId("");
      setSortOrder("0");
      setColumnCount("2");
      setExternalProductId("");
      setRedirectToSales(false);
      setSalesPageUrl("");
      setLogoUnlockedUrl(null);
      setLogoLockedUrl(null);
      setCoverUrl(null);
    }
    supabase
      .from("sections")
      .select("id, title")
      .eq("app_id", appId)
      .order("sort_order")
      .then(({ data }) => setSections(data || []));
  }, [open, appId, existingProduct]);

  const uploadFile = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("app-assets").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("app-assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setter(url);
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        app_id: appId,
        user_id: userId,
        name: name.trim(),
        price: price ? parseFloat(price) : null,
        hidden_name: hiddenName,
        release_type: releaseType,
        release_value: releaseValue || null,
        offer_type: offerType,
        section_id: sectionId || null,
        sort_order: parseInt(sortOrder) || 0,
        column_count: parseInt(columnCount) || 2,
        external_product_id: externalProductId || null,
        redirect_to_sales: redirectToSales,
        sales_page_url: salesPageUrl || null,
        logo_unlocked_url: logoUnlockedUrl,
        logo_locked_url: logoLockedUrl,
        cover_url: coverUrl,
      };

      if (existingProduct) {
        const { error } = await supabase.from("products").update(payload).eq("id", existingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
      toast({ title: existingProduct ? "Produto atualizado!" : "Produto criado!" });
      onProductCreated();
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
            <Package className="h-5 w-5 text-primary" />
            {existingProduct ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label>Nome do Produto</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Tratamento Completo" />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label>Preço (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0 = Gratuito"
            />
            <p className="text-xs text-muted-foreground">Deixe vazio ou 0 para conteúdo gratuito.</p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="hidden-name">Ocultar nome no app?</Label>
            <Switch id="hidden-name" checked={hiddenName} onCheckedChange={setHiddenName} />
          </div>

          {/* Offer type */}
          <div className="space-y-2">
            <Label>Tipo da Oferta</Label>
            <Select value={offerType} onValueChange={setOfferType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {offerTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section */}
          {sections.length > 0 && (
            <div className="space-y-2">
              <Label>Seção na Home</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger><SelectValue placeholder="Selecione uma seção" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Release type */}
          <div className="space-y-2">
            <Label>Quando liberar acesso?</Label>
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
                placeholder={releaseType === "days_after" ? "7" : ""}
              />
            </div>
          )}

          {/* Display columns */}
          <div className="space-y-2">
            <Label>Módulos em quantas colunas?</Label>
            <Select value={columnCount} onValueChange={setColumnCount}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Coluna</SelectItem>
                <SelectItem value="2">2 Colunas</SelectItem>
                <SelectItem value="3">3 Colunas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort order */}
          <div className="space-y-2">
            <Label>Ordem de aparição</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" />
          </div>

          {/* External ID */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label>ID do Produto na Plataforma</Label>
              <div className="group relative">
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block w-52 rounded-lg bg-foreground text-background text-xs p-2 shadow-lg z-10">
                  Encontre este ID na plataforma de vendas (Hotmart, Kiwify, etc.) nas configurações do produto.
                </div>
              </div>
            </div>
            <Input value={externalProductId} onChange={(e) => setExternalProductId(e.target.value)} placeholder="Ex: prod_12345" />
          </div>

          {/* Redirect */}
          <div className="flex items-center justify-between">
            <Label htmlFor="redirect-sales">Redirecionar para vendas se bloqueado?</Label>
            <Switch id="redirect-sales" checked={redirectToSales} onCheckedChange={setRedirectToSales} />
          </div>

          {redirectToSales && (
            <div className="space-y-2">
              <Label>URL da Página de Vendas</Label>
              <Input value={salesPageUrl} onChange={(e) => setSalesPageUrl(e.target.value)} placeholder="https://..." />
            </div>
          )}

          {/* Cover */}
          <div className="space-y-2">
            <Label>Capa do Produto</Label>
            <input type="file" ref={coverRef} accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setCoverUrl)} />
            <div
              onClick={() => coverRef.current?.click()}
              className="flex h-32 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-accent/30 hover:border-primary/60 overflow-hidden transition-colors"
            >
              {coverUrl ? (
                <img src={coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center">
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground mt-1">Capa exibida na home</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tamanho ideal: 400×600px (retrato)</p>
          </div>

          {/* Logos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Logo Liberado</Label>
              <input type="file" ref={unlockedRef} accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setLogoUnlockedUrl)} />
              <div
                onClick={() => unlockedRef.current?.click()}
                className="flex h-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-accent/30 hover:border-primary/60 overflow-hidden transition-colors"
              >
                {logoUnlockedUrl ? (
                  <img src={logoUnlockedUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Tamanho ideal: 200×200px (quadrado)</p>
            </div>
            <div className="space-y-2">
              <Label>Logo Bloqueado 🔒</Label>
              <input type="file" ref={lockedRef} accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setLogoLockedUrl)} />
              <div
                onClick={() => lockedRef.current?.click()}
                className="flex h-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 hover:border-primary/40 overflow-hidden transition-colors"
              >
                {logoLockedUrl ? (
                  <img src={logoLockedUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Tamanho ideal: 200×200px (quadrado)</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button variant="hero" className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : existingProduct ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
