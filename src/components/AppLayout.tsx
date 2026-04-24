import { Outlet, Navigate } from "react-router-dom";
import AppTopNav from "./AppTopNav";
import SupportBubble from "./SupportBubble";
import { useAuth } from "@/contexts/AuthContext";

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center aurora-bg">
        <div className="font-display text-2xl gradient-text animate-pulse">carregando…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen aurora-bg text-foreground">
      <AppTopNav />
      <main className="mx-auto max-w-7xl px-4 lg:px-8 py-6 lg:py-10">
        <Outlet />
      </main>
      <SupportBubble />
    </div>
  );
}
