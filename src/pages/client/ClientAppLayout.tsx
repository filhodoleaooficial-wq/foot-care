import { useState, useEffect } from "react";
import { useParams, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export interface AppConfig {
  id: string;
  name: string;
  logo_url: string | null;
  background_url: string | null;
  primary_color: string;
  welcome_text: string;
  login_type: string;
  visual_style: string;
  show_progress: boolean;
}

const ClientAppLayout = () => {
  const { appId } = useParams<{ appId: string }>();
  const [app, setApp] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApp = async () => {
      if (!appId) return;
      const { data, error } = await supabase
        .from("apps")
        .select("id, name, logo_url, background_url, primary_color, welcome_text, login_type, visual_style, show_progress")
        .eq("id", appId)
        .single();

      if (error || !data) {
        setError(true);
      } else {
        setApp(data);
      }
      setLoading(false);
    };
    fetchApp();
  }, [appId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold text-foreground">App não encontrado</h1>
        <p className="text-muted-foreground">O aplicativo que você procura não existe ou não está publicado.</p>
        <button onClick={() => navigate("/login")} className="text-primary hover:underline text-sm font-medium">
          Voltar ao início
        </button>
      </div>
    );
  }

  return <Outlet context={app} />;
};

export default ClientAppLayout;
