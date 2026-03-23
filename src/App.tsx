import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import VivaBemLogin from "./pages/VivaBemLogin";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AppCreation from "./pages/AppCreation";
import ProductsManagement from "./pages/ProductsManagement";
import WhatsAppPage from "./pages/WhatsAppPage";
import ClientAppLayout from "./pages/client/ClientAppLayout";
import ClientLogin from "./pages/client/ClientLogin";
import ClientHome from "./pages/client/ClientHome";
import ClientProduct from "./pages/client/ClientProduct";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<VivaBemLogin />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/create-app" element={<ProtectedRoute><AppCreation /></ProtectedRoute>} />
            <Route path="/app/:appId/products" element={<ProtectedRoute><ProductsManagement /></ProtectedRoute>} />
            <Route path="/whatsapp" element={<ProtectedRoute><WhatsAppPage /></ProtectedRoute>} />

            {/* Client-facing app routes */}
            <Route path="/app/:appId" element={<ClientAppLayout />}>
              <Route index element={<ClientLogin />} />
              <Route path="home" element={<ClientHome />} />
              <Route path="product/:productId" element={<ClientProduct />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
