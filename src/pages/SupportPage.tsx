import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, HelpCircle, Mail, MessageSquare, BookOpen } from "lucide-react";

const SupportPage = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Suporte</h1>
        <p className="text-muted-foreground mb-8">Precisa de ajuda? Entre em contato conosco.</p>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Mail className="h-5 w-5 text-primary" /> E-mail</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Envie um e-mail para <strong>suporte@pesaude.com</strong></p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><MessageSquare className="h-5 w-5 text-green-600" /> WhatsApp</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Fale conosco pelo WhatsApp: <strong>(31) 99999-9999</strong></p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="h-5 w-5 text-blue-600" /> Base de Conhecimento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Consulte nosso guia completo em <strong>docs/guia-completo-app.md</strong></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
