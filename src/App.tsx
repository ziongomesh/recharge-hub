import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import AppLayout from "@/components/AppLayout";
import AdminLayout from "@/components/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import TermosPage from "@/pages/TermosPage";
import HomePage from "@/pages/HomePage";
import PrecosPage from "@/pages/PrecosPage";
import RecargasPage from "@/pages/RecargasPage";
import HistoricoPage from "@/pages/HistoricoPage";
import PagamentosPage from "@/pages/PagamentosPage";
import ConfiguracoesPage from "@/pages/ConfiguracoesPage";
import AdminPinPage from "@/pages/admin/AdminPinPage";
import AdminHubPage from "@/pages/admin/AdminHubPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminOperadorasPage from "@/pages/admin/AdminOperadorasPage";
import AdminNoticiasPage from "@/pages/admin/AdminNoticiasPage";
import AdminUsuariosPage from "@/pages/admin/AdminUsuariosPage";
import AdminUserDetailPage from "@/pages/admin/AdminUserDetailPage";
import AdminRecargasPage from "@/pages/admin/AdminRecargasPage";
import AdminDepositosPage from "@/pages/admin/AdminDepositosPage";
import AdminLogsPage from "@/pages/admin/AdminLogsPage";
import AdminSuportePage from "@/pages/admin/AdminSuportePage";
import AdminStaffPage from "@/pages/admin/AdminStaffPage";
import AdminEsimPage from "@/pages/admin/AdminEsimPage";
import AdminSmsPage from "@/pages/admin/AdminSmsPage";
import EsimPage from "@/pages/EsimPage";
import SmsPage from "@/pages/SmsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// App roda na raiz do domínio (cometasms.com)
const routerBasename = undefined;

function HomeRedirect() {
  const { user, loading, adminVerified } = useAuth();

  if (loading && !user) return <HomePage />;
  if (!user) return <HomePage />;
  if (user.role === "admin" || user.role === "mod") {
    return <Navigate to={adminVerified ? "/admin" : "/admin/pin"} replace />;
  }
  return <Navigate to="/recargas" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter basename={routerBasename}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/termos" element={<TermosPage />} />
            <Route path="/admin/pin" element={<AdminPinPage />} />
            <Route path="/precos" element={<PrecosPage />} />

            <Route path="/" element={<HomeRedirect />} />

            {/* Área cliente */}
            <Route element={<AppLayout />}>
              <Route path="/recargas" element={<RecargasPage />} />
              <Route path="/esim" element={<EsimPage />} />
              <Route path="/sms" element={<SmsPage />} />
              <Route path="/historico" element={<HistoricoPage />} />
              <Route path="/pagamentos" element={<PagamentosPage />} />
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />
            </Route>

            {/* Área admin (layout + sidebar separados) */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminHubPage />} />
              <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
              <Route path="/admin/usuarios/:id" element={<AdminUserDetailPage />} />
              <Route path="/admin/depositos" element={<AdminDepositosPage />} />
              <Route path="/admin/recargas" element={<AdminDashboardPage />} />
              <Route path="/admin/recargas/lista" element={<AdminRecargasPage />} />
              <Route path="/admin/operadoras" element={<AdminOperadorasPage />} />
              <Route path="/admin/noticias" element={<AdminNoticiasPage />} />
              <Route path="/admin/logs" element={<AdminLogsPage />} />
              <Route path="/admin/suporte" element={<AdminSuportePage />} />
              <Route path="/admin/staff" element={<AdminStaffPage />} />
              <Route path="/admin/esim" element={<AdminEsimPage />} />
              <Route path="/admin/sms" element={<AdminSmsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
