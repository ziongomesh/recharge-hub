import { Outlet, Navigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import SmsSidebar from "./SmsSidebar";
import { useAuth } from "@/contexts/AuthContext";

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex">
      {/* SMS Services - fixed left */}
      <SmsSidebar />

      {/* Nav Sidebar */}
      <div style={{ marginLeft: "240px" }}>
        <AppSidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 transition-all" style={{ marginLeft: "calc(240px + var(--sidebar-width))" }}>
        <div className="p-8">
          <Outlet />
        </div>
        <footer className="border-t text-xs text-muted-foreground flex items-center justify-between px-8 py-3">
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
