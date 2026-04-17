import { Outlet, Navigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import AdminTopBar from "./AdminTopBar";
import { useAuth } from "@/contexts/AuthContext";

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen">
      <AppSidebar />
      <main className="transition-all" style={{ marginLeft: "var(--sidebar-width)" }}>
        <AdminTopBar />
        <div className="p-8">
          <Outlet />
        </div>
        <footer className="border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between px-8 py-3">
          <div className="flex gap-3">
            <span>Status</span>
            <span>/</span>
            <span>Termos de uso</span>
            <span>/</span>
            <span>Suporte</span>
          </div>
          <span>CometaSMS © 2026</span>
        </footer>
      </main>
    </div>
  );
}
