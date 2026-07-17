import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Settings, Save, Loader2, HelpCircle } from "lucide-react";

interface AppConfig {
  id: string;
  name: string;
  description: string | null;
  support_email: string | null;
  support_phone: string | null;
  support_whatsapp: string | null;
  support_knowledge: string | null;
  welcome_text: string;
  primary_color: string;
  login_type: string;
  visual_style: string;
  show_progress: boolean;
}

const SettingsPage = () => {
  const { toast } = useToast();
  const [app, setApp] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchApp = async () => {
      const { data } = await supabase
        .from("apps")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
      if (data) setApp(data);
      setLoading(false);
    };
    fetchApp();
  }, []);

  const handleSave = async () => {
    if (!app) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("apps")
        .update({
          name: app.name,
          description: app.description,
          support_email: app.support_email,
          support_phone: app.support_phone,
          support_whatsapp: app.support_whatsapp,
          support_knowledge: app.support_knowledge,
          welcome_text: app.welcome_text,
        })
        .eq("id", app.id);
      if (error) throw error;
      toast({ title: "Configurações salvas!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Configurações</h1>
        <p className="text-muted-foreground mb-8">Gerencie as configurações gerais do app</p>

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : !app ? (
          <Card><CardContent className="text-center py-16 text-muted-foreground">Nenhum app encontrado.</CardContent></Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Geral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Nome do App</Label>
                  <Input value={app.name} onChange={(e) => setApp({ ...app, name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input value={app.description || ""} onChange={(e) => setApp({ ...app, description: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Mensagem de Boas-vindas</Label>
                  <Input value={app.welcome_text} onChange={(e) => setApp({ ...app, welcome_text: e.target.value })} className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" /> Suporte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>E-mail de Suporte</Label>
                  <Input value={app.support_email || ""} onChange={(e) => setApp({ ...app, support_email: e.target.value })} placeholder="suporte@exemplo.com" className="mt-1" />
                </div>
                <div>
                  <Label>Telefone de Suporte</Label>
                  <Input value={app.support_phone || ""} onChange={(e) => setApp({ ...app, support_phone: e.target.value })} placeholder="(31) 3333-4444" className="mt-1" />
                </div>
                <div>
                  <Label>WhatsApp de Suporte</Label>
                  <Input value={app.support_whatsapp || ""} onChange={(e) => setApp({ ...app, support_whatsapp: e.target.value })} placeholder="5531999999999" className="mt-1" />
                </div>
                <div>
                  <Label>Link da Base de Conhecimento</Label>
                  <Input value={app.support_knowledge || ""} onChange={(e) => setApp({ ...app, support_knowledge: e.target.value })} placeholder="https://..." className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Tudo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
