import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getClientSession } from "@/lib/client-session";

const ClientProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setOk(!!getClientSession() || !!data.session);
    });
  }, []);

  if (ok === null) return null;
  if (!ok) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export default ClientProtectedRoute;