import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, MessageSquare, BookOpen } from "lucide-react";

interface SupportInfo {
  support_email: string | null;
  support_phone: string | null;
  support_whatsapp: string | null;
  support_knowledge: string | null;
}

const SupportPage = () => {
  const [support, setSupport] = useState<SupportInfo | null>(null);

  useEffect(() => {
    const fetchSupport = async () => {
      const { data } = await supabase
        .from("apps")
        .select("support_email, support_phone, support_whatsapp, support_knowledge")
        .eq("status", "published")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
      if (data) setSupport(data);
    };
    fetchSupport();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Suporte</h1>
        <p className="text-muted-foreground mb-8">Informações de contato para seus clientes</p>

        <div className="space-y-4">
          {support?.support_email && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Mail className="h-5 w-5 text-primary" /> E-mail</CardTitle></CardHeader>
              <CardContent><p className="text-muted-foreground">{support.support_email}</p></CardContent>
            </Card>
          )}
          {support?.support_phone && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Phone className="h-5 w-5 text-blue-600" /> Telefone</CardTitle></CardHeader>
              <CardContent><p className="text-muted-foreground">{support.support_phone}</p></CardContent>
            </Card>
          )}
          {support?.support_whatsapp && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><MessageSquare className="h-5 w-5 text-green-600" /> WhatsApp</CardTitle></CardHeader>
              <CardContent><p className="text-muted-foreground">{support.support_whatsapp}</p></CardContent>
            </Card>
          )}
          {support?.support_knowledge && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="h-5 w-5 text-orange-600" /> Base de Conhecimento</CardTitle></CardHeader>
              <CardContent><a href={support.support_knowledge} target="_blank" rel="noopener noreferrer" className="text-primary underline">{support.support_knowledge}</a></CardContent>
            </Card>
          )}
          {!support?.support_email && !support?.support_phone && !support?.support_whatsapp && !support?.support_knowledge && (
            <Card><CardContent className="text-center py-16 text-muted-foreground">Nenhuma informação de suporte configurada. Edite em <strong>Configurações</strong>.</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
