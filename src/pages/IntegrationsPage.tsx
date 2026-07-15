import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, Link2, Zap, CreditCard, ShoppingCart, Globe, Loader2, CheckCircle2 } from "lucide-react";

interface IntegrationField {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
}

interface IntegrationDef {
  name: string;
  slug: string;
  description: string;
  icon: any;
  color: string;
  url: string;
  fields: IntegrationField[];
}

const integrations: IntegrationDef[] = [
  {
    name: "Stripe",
    slug: "stripe",
    description: "Pagamentos online com cartão de crédito, boleto e PIX",
    icon: CreditCard,
    color: "#635BFF",
    url: "https://stripe.com",
    fields: [
      { key: "stripe_secret_key", label: "Chave Secreta (Secret Key)", placeholder: "sk_live_..." },
      { key: "stripe_publishable_key", label: "Chave Publicável (Publishable Key)", placeholder: "pk_live_..." },
    ],
  },
  {
    name: "WhatsApp (Evolution API)",
    slug: "whatsapp",
    description: "Envio de mensagens via WhatsApp Business API",
    icon: Zap,
    color: "#25D366",
    url: "https://doc.evolution-api.com",
    fields: [
      { key: "evolution_api_url", label: "URL da API", placeholder: "https://sua-api.com.br" },
      { key: "evolution_api_key", label: "Chave da API (API Key)", placeholder: "Sua API Key" },
      { key: "evolution_instance_name", label: "Nome da Instância", placeholder: "minha-instancia" },
    ],
  },
  {
    name: "Hotmart",
    slug: "hotmart",
    description: "Plataforma de infoprodutos e cursos online",
    icon: Zap,
    color: "#FF5722",
    url: "https://hotmart.com",
    fields: [
      { key: "client_id", label: "Client ID", placeholder: "Seu Client ID" },
      { key: "client_secret", label: "Client Secret", placeholder: "Seu Client Secret" },
    ],
  },
  {
    name: "Kiwify",
    slug: "kiwify",
    description: "Checkout otimizado para infoprodutos brasileiros",
    icon: ShoppingCart,
    color: "#00C853",
    url: "https://kiwify.com.br",
    fields: [
      { key: "api_token", label: "Token de Acesso", placeholder: "Seu Token" },
    ],
  },
  {
    name: "PerfectPay",
    slug: "perfectpay",
    description: "Plataforma de pagamento para infoprodutos",
    icon: CreditCard,
    color: "#2196F3",
    url: "https://perfectpay.com.br",
    fields: [
      { key: "api_token", label: "Token de Acesso", placeholder: "Seu Token" },
    ],
  },
  {
    name: "Monetizze",
    slug: "monetizze",
    description: "Plataforma de vendas de produtos digitais",
    icon: Zap,
    color: "#9C27B0",
    url: "https://monetizze.com.br",
    fields: [
      { key: "api_key", label: "Chave de Acesso (API Key)", placeholder: "Sua API Key" },
    ],
  },
];

const IntegrationsPage = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.functions.invoke("integration-settings", {
        body: { action: "list" },
      });
      if (!error && data?.settings) {
        const map: Record<string, any> = {};
        data.settings.forEach((s: any) => {
          map[s.integration_name] = s;
        });
        setSettings(map);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (integration: IntegrationDef) => {
    setSaving(integration.slug);
    try {
      const existing = settings[integration.slug];
      const credentials: Record<string, string> = {};
      integration.fields.forEach((f) => {
        const el = document.getElementById(`${integration.slug}-${f.key}`) as HTMLInputElement;
        credentials[f.key] = el?.value || existing?.credentials?.[f.key] || "";
      });

      const hasAllFields = integration.fields.every((f) => credentials[f.key]?.trim());
      const isActive = hasAllFields && (existing?.is_active ?? true);

      const { data, error } = await supabase.functions.invoke("integration-settings", {
        body: {
          action: "save",
          integration_name: integration.slug,
          credentials,
          is_active: isActive,
        },
      });
      if (error) throw error;

      setSettings((prev) => ({
        ...prev,
        [integration.slug]: data?.setting,
      }));

      toast({
        title: `${integration.name} salvo!`,
        description: isActive ? "Integração ativa e pronta para uso." : "Credenciais salvas.",
      });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const activeCount = Object.values(settings).filter((s: any) => s?.is_active).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Painel
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Integrações</h1>
            <p className="text-muted-foreground mt-1">
              Configure as credenciais de cada serviço para conectar ao seu app
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {activeCount} ativa{activeCount !== 1 ? "s" : ""}
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {integrations.map((integration) => {
              const existing = settings[integration.slug];
              const isActive = existing?.is_active ?? false;
              const isSaving = saving === integration.slug;

              return (
                <Card key={integration.slug}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${integration.color}20` }}
                        >
                          <integration.icon className="h-5 w-5" style={{ color: integration.color }} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription>{integration.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inativa</Badge>
                        )}
                        <a
                          href={integration.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {integration.fields.map((field) => (
                        <div key={field.key}>
                          <Label htmlFor={`${integration.slug}-${field.key}`} className="text-sm">
                            {field.label}
                          </Label>
                          <Input
                            id={`${integration.slug}-${field.key}`}
                            type={field.type || "password"}
                            placeholder={field.placeholder}
                            defaultValue={existing?.credentials?.[field.key] || ""}
                            className="mt-1"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => handleSave(integration)}
                        disabled={isSaving}
                        size="sm"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Salvar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationsPage;
