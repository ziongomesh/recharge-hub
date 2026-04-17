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
import RecargasPage from "@/pages/RecargasPage";
import HistoricoPage from "@/pages/HistoricoPage";
import PagamentosPage from "@/pages/PagamentosPage";
import ConfiguracoesPage from "@/pages/ConfiguracoesPage";
import AdminPinPage from "@/pages/admin/AdminPinPage";
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
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return <HomePage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/termos" element={<TermosPage />} />
            <Route path="/admin/pin" element={<AdminPinPage />} />

            <Route path="/" element={<HomeRedirect />} />

            {/* Área cliente */}
            <Route element={<AppLayout />}>
              <Route path="/recargas" element={<RecargasPage />} />
              <Route path="/historico" element={<HistoricoPage />} />
              <Route path="/pagamentos" element={<PagamentosPage />} />
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />
            </Route>

            {/* Área admin (layout + sidebar separados) */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
              <Route path="/admin/usuarios/:id" element={<AdminUserDetailPage />} />
              <Route path="/admin/depositos" element={<AdminDepositosPage />} />
              <Route path="/admin/recargas" element={<AdminRecargasPage />} />
              <Route path="/admin/operadoras" element={<AdminOperadorasPage />} />
              <Route path="/admin/noticias" element={<AdminNoticiasPage />} />
              <Route path="/admin/logs" element={<AdminLogsPage />} />
              <Route path="/admin/suporte" element={<AdminSuportePage />} />
              <Route path="/admin/staff" element={<AdminStaffPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
