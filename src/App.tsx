import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import HomePage from "@/pages/HomePage";
import RecargasPage from "@/pages/RecargasPage";
import HistoricoPage from "@/pages/HistoricoPage";
import PagamentosPage from "@/pages/PagamentosPage";
import ConfiguracoesPage from "@/pages/ConfiguracoesPage";
import AdminOperadorasPage from "@/pages/admin/AdminOperadorasPage";
import AdminNoticiasPage from "@/pages/admin/AdminNoticiasPage";
import AdminUsuariosPage from "@/pages/admin/AdminUsuariosPage";
import AdminRecargasPage from "@/pages/admin/AdminRecargasPage";
import AdminLogsPage from "@/pages/admin/AdminLogsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
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
            <Route path="/" element={<HomePage />} />
            <Route element={<AppLayout />}>
              <Route path="/recargas" element={<RecargasPage />} />
              <Route path="/historico" element={<HistoricoPage />} />
              <Route path="/pagamentos" element={<PagamentosPage />} />
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />
              <Route path="/admin/operadoras" element={<AdminRoute><AdminOperadorasPage /></AdminRoute>} />
              <Route path="/admin/noticias" element={<AdminRoute><AdminNoticiasPage /></AdminRoute>} />
              <Route path="/admin/usuarios" element={<AdminRoute><AdminUsuariosPage /></AdminRoute>} />
              <Route path="/admin/recargas" element={<AdminRoute><AdminRecargasPage /></AdminRoute>} />
              <Route path="/admin/logs" element={<AdminRoute><AdminLogsPage /></AdminRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
