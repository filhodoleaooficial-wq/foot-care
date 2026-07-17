import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ClientProtectedRoute from "@/components/ClientProtectedRoute";
import QuizPage from "./pages/QuizPage";
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
import SectionsManagement from "./pages/SectionsManagement";
import WhatsAppPage from "./pages/WhatsAppPage";
import BlogManagement from "./pages/BlogManagement";
import CommunityManagement from "./pages/CommunityManagement";
import IntegrationsPage from "./pages/IntegrationsPage";
import ClientsPage from "./pages/ClientsPage";
import SalesPage from "./pages/SalesPage";
import SupportPage from "./pages/SupportPage";
import SettingsPage from "./pages/SettingsPage";
import QuizManagement from "./pages/QuizManagement";
import CommunityPage from "./pages/CommunityPage";
import FeedPage from "./pages/FeedPage";
import SavedModulesPage from "./pages/SavedModulesPage";
import SearchPage from "./pages/SearchPage";
import StorePage from "./pages/StorePage";
import BlogPage from "./pages/BlogPage";
import NotFound from "./pages/NotFound";
import ClientAppLayout from "./pages/client/ClientAppLayout";
import ClientLogin from "./pages/client/ClientLogin";
import ClientHome from "./pages/client/ClientHome";
import ClientProduct from "./pages/client/ClientProduct";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Quiz (entry point) */}
            <Route path="/" element={<QuizPage />} />

            {/* Client login */}
            <Route path="/login" element={<VivaBemLogin />} />

            {/* Payment result pages */}
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />

            {/* Client protected routes */}
            <Route element={<ClientProtectedRoute><VivaBemLayout /></ClientProtectedRoute>}>
              <Route path="/home" element={<VivaBemHome />} />
              <Route path="/produto/:productId" element={<VivaBemProduct />} />
              <Route path="/instalar" element={<InstallAppPage />} />
              <Route path="/comunidade" element={<CommunityPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/salvos" element={<SavedModulesPage />} />
              <Route path="/pesquisar" element={<SearchPage />} />
              <Route path="/loja" element={<StorePage />} />
              <Route path="/blog" element={<BlogPage />} />
            </Route>

            {/* Dynamic client app routes (shareable link) */}
            <Route path="/app/:appId" element={<ClientAppLayout />}>
              <Route index element={<ClientLogin />} />
              <Route path="login" element={<ClientLogin />} />
              <Route path="home" element={<ClientHome />} />
              <Route path="produto/:productId" element={<ClientProduct />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/create-app" element={<ProtectedRoute><AppCreation /></ProtectedRoute>} />
            <Route path="/admin/app/:appId/products" element={<ProtectedRoute><ProductsManagement /></ProtectedRoute>} />
            <Route path="/admin/product/:productId/modules" element={<ProtectedRoute><ModulesManagement /></ProtectedRoute>} />
            <Route path="/admin/app/:appId/sections" element={<ProtectedRoute><SectionsManagement /></ProtectedRoute>} />
            <Route path="/admin/whatsapp" element={<ProtectedRoute><WhatsAppPage /></ProtectedRoute>} />
            <Route path="/admin/blog" element={<ProtectedRoute><BlogManagement /></ProtectedRoute>} />
            <Route path="/admin/community" element={<ProtectedRoute><CommunityManagement /></ProtectedRoute>} />
            <Route path="/admin/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
            <Route path="/admin/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
            <Route path="/admin/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
            <Route path="/admin/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/admin/quiz" element={<ProtectedRoute><QuizManagement /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
