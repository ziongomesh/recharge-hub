import { Outlet, Navigate, useLocation } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import SupportBubble from "./SupportBubble";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { statusApi, settingsApi, type StatusResponse } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Send } from "lucide-react";

const routeMeta: Record<string, { num: string; label: string }> = {
  "/recargas":      { num: "01", label: "Recargas" },
  "/historico":     { num: "02", label: "Histórico" },
  "/pagamentos":    { num: "03", label: "Pagamentos" },
  "/configuracoes": { num: "04", label: "Conta" },
};

function StatusBadge({
  label,
  online,
  reason,
  extra,
}: {
  label: string;
  online: boolean;
  reason?: string | null;
  extra?: string | null;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1.5 cursor-help">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              online ? "bg-success animate-pulse" : "bg-destructive"
            }`}
          />
          <span>{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs normal-case tracking-normal font-mono-x max-w-xs">
        <div className="font-medium mb-1">
          {label} — {online ? "operacional" : "indisponível"}
        </div>
        {reason && <div className="text-muted-foreground">{reason}</div>}
        {extra && <div className="text-muted-foreground mt-1">{extra}</div>}
      </TooltipContent>
    </Tooltip>
  );
}

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const [status, setStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = () =>
      statusApi.get().then((s) => alive && setStatus(s)).catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="font-display text-2xl animate-pulse">carregando…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const meta = routeMeta[pathname] ?? { num: "—", label: "" };

  const allOnline =
    status && status.recargas.online && status.sms.online && status.esim.online;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background noise">
        <AppSidebar />
        <main className="transition-all" style={{ marginLeft: "var(--sidebar-width)" }}>
          <header className="px-10 pt-8 pb-5 border-b border-border flex items-end justify-between gap-6">
            <div>
              <div className="label-eyebrow flex items-center gap-3">
                <span>{meta.num}</span>
                <span className="w-8 border-t border-foreground/40" />
                <span>Seção</span>
              </div>
              <h1 className="font-display text-5xl leading-none mt-2">{meta.label}</h1>
            </div>
          </header>

          <div className="px-10 py-10 max-w-6xl">
            <Outlet />
          </div>

          <footer className="border-t border-border px-10 py-5 flex items-center justify-between text-[11px] font-mono-x uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 ${
                  allOnline ? "text-foreground" : "text-destructive"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    allOnline ? "bg-success animate-pulse" : "bg-destructive"
                  }`}
                />
                {allOnline ? "online" : status ? "degradado" : "···"}
              </span>
              {status && (
                <>
                  <span>·</span>
                  <StatusBadge
                    label="Recargas"
                    online={status.recargas.online}
                    reason={
                      status.recargas.maintenance
                        ? "Em manutenção pelo admin"
                        : status.recargas.reason
                    }
                    extra={
                      status.recargas.operadoras && status.recargas.operadoras.length
                        ? `Operadoras: ${status.recargas.operadoras.join(", ")}`
                        : "Sem operadoras ativas"
                    }
                  />
                  <span>·</span>
                  <StatusBadge
                    label="SMS"
                    online={status.sms.online}
                    reason={
                      status.sms.maintenance ? "Em manutenção pelo admin" : status.sms.reason
                    }
                  />
                  <span>·</span>
                  <StatusBadge
                    label="eSIM"
                    online={status.esim.online}
                    reason={
                      status.esim.maintenance ? "Em manutenção pelo admin" : status.esim.reason
                    }
                  />
                </>
              )}
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
    </TooltipProvider>
  );
}
