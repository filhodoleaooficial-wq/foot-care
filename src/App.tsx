import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ClientProtectedRoute from "@/components/ClientProtectedRoute";
import VivaBemLogin from "./pages/VivaBemLogin";
import VivaBemLayout from "./pages/VivaBemLayout";
import VivaBemHome from "./pages/VivaBemHome";
import VivaBemProduct from "./pages/VivaBemProduct";
import InstallAppPage from "./pages/InstallAppPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AppCreation from "./pages/AppCreation";
import ProductsManagement from "./pages/ProductsManagement";
import ModulesManagement from "./pages/ModulesManagement";
import WhatsAppPage from "./pages/WhatsAppPage";
import CommunityPage from "./pages/CommunityPage";
import FeedPage from "./pages/FeedPage";
import SavedModulesPage from "./pages/SavedModulesPage";
import SearchPage from "./pages/SearchPage";
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
            {/* VivaBem client routes */}
            <Route path="/" element={<VivaBemLogin />} />
            <Route element={<ClientProtectedRoute><VivaBemLayout /></ClientProtectedRoute>}>
              <Route path="/home" element={<VivaBemHome />} />
              <Route path="/produto/:productId" element={<VivaBemProduct />} />
              <Route path="/instalar" element={<InstallAppPage />} />
              <Route path="/comunidade" element={<CommunityPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/salvos" element={<SavedModulesPage />} />
              <Route path="/pesquisar" element={<SearchPage />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/create-app" element={<ProtectedRoute><AppCreation /></ProtectedRoute>} />
            <Route path="/admin/app/:appId/products" element={<ProtectedRoute><ProductsManagement /></ProtectedRoute>} />
            <Route path="/admin/product/:productId/modules" element={<ProtectedRoute><ModulesManagement /></ProtectedRoute>} />
            <Route path="/admin/whatsapp" element={<ProtectedRoute><WhatsAppPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
