import { Outlet, Navigate, useLocation } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import SupportBubble from "./SupportBubble";
import { useAuth } from "@/contexts/AuthContext";

const routeMeta: Record<string, { num: string; label: string }> = {
  "/recargas":      { num: "01", label: "Recargas" },
  "/historico":     { num: "02", label: "Histórico" },
  "/pagamentos":    { num: "03", label: "Pagamentos" },
  "/configuracoes": { num: "04", label: "Conta" },
};

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="font-display text-2xl animate-pulse">carregando…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const meta = routeMeta[pathname] ?? { num: "—", label: "" };

  return (
    <div className="min-h-screen bg-background text-foreground noise">
        <AppSidebar />
        <main className="transition-all" style={{ marginLeft: "var(--sidebar-width)" }}>
          <header className="border-b border-border/50 bg-background/80 px-10 pt-8 pb-5 flex items-end justify-between gap-6 backdrop-blur">
            <div>
              <div className="label-eyebrow flex items-center gap-3">
                <span>{meta.num}</span>
                <span className="w-8 border-t border-foreground/40" />
                <span>Seção</span>
              </div>
              <h1 className="font-display text-5xl leading-none mt-2 text-primary">{meta.label}</h1>
            </div>
          </header>

          <div className="px-10 py-10 max-w-6xl [&_.border-border]:border-border/60 [&_.bg-paper]:bg-card [&_.bg-paper-2]:bg-secondary/60 [&_.bg-card]:bg-card [&_input]:rounded-xl [&_select]:rounded-xl [&_textarea]:rounded-xl [&_button]:transition-all">
            <Outlet />
          </div>

        </main>
        <SupportBubble />
      </div>
  );
}
