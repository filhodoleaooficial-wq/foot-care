import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

interface AppConfigContextType {
  app: AppConfig | null;
  loading: boolean;
}

const AppConfigContext = createContext<AppConfigContextType>({ app: null, loading: true });

export const AppConfigProvider = ({ children }: { children: ReactNode }) => {
  const [app, setApp] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApp = async () => {
      // Fetch the first published app available
      const { data } = await supabase
        .from("apps")
        .select("id, name, logo_url, background_url, primary_color, welcome_text, login_type, visual_style, show_progress")
        .eq("status", "published")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (data) setApp(data);
      setLoading(false);
    };
    fetchApp();
  }, []);

  return (
    <AppConfigContext.Provider value={{ app, loading }}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => useContext(AppConfigContext);
