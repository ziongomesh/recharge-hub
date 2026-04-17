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
    <div className="min-h-screen bg-background noise">
      <AppSidebar />
      <main className="transition-all" style={{ marginLeft: "var(--sidebar-width)" }}>
        {/* Page header — editorial */}
        <header className="px-10 pt-8 pb-5 border-b border-border flex items-end justify-between gap-6">
          <div>
            <div className="label-eyebrow flex items-center gap-3">
              <span>{meta.num}</span>
              <span className="w-8 border-t border-foreground/40" />
              <span>Seção</span>
            </div>
            <h1 className="font-display text-5xl leading-none mt-2">{meta.label}</h1>
          </div>
          <div className="text-right">
            <div className="label-eyebrow">{new Date().toLocaleDateString("pt-BR", { weekday: "long" })}</div>
            <div className="font-mono-x tabular text-xs mt-1">
              {new Date().toLocaleDateString("pt-BR")} · São Paulo
            </div>
          </div>
        </header>

        <div className="px-10 py-10 max-w-6xl">
          <Outlet />
        </div>

        <footer className="border-t border-border px-10 py-5 flex items-center justify-between text-[11px] font-mono-x uppercase tracking-widest text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>● online</span>
            <span>·</span>
            <span>v1.0</span>
            <span>·</span>
            <span>suporte</span>
          </div>
          <span>Cometa SMS — MMXXVI</span>
        </footer>
      </main>
      <SupportBubble />
    </div>
  );
}
