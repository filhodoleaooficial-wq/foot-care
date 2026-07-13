import { Navigate } from "react-router-dom";
import { getClientSession } from "@/lib/client-session";

const ClientProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const session = getClientSession();

  if (!session) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ClientProtectedRoute;
