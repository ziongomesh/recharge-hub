import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { recargasApi, esimApi, smsApi, type Recarga, type EsimVenda, type SmsActivation } from "@/lib/api";
import { Loader2, Zap, Smartphone, MessageSquare, History as HistoryIcon } from "lucide-react";
import RecargaStatusModal from "@/components/RecargaStatusModal";

type Tab = "recargas" | "esim" | "sms";

export default function HistoricoPage() {
  const [recargas, setRecargas] = useState<Recarga[]>([]);
  const [esimVendas, setEsimVendas] = useState<EsimVenda[]>([]);
  const [smsHistory, setSmsHistory] = useState<SmsActivation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("recargas");
  const location = useLocation();
  const navigate = useNavigate();

  const navState = (location.state || {}) as { newRecargaId?: number; newRecarga?: Recarga };
  const [trackingId, setTrackingId] = useState<number | null>(navState.newRecargaId ?? null);
  const [highlightId, setHighlightId] = useState<number | null>(navState.newRecargaId ?? null);

  const load = () => {
    setLoading(true);
    Promise.all([
      recargasApi.list().then((r) => setRecargas(r.recargas)).catch(() => {}),
      esimApi.minhas().then((r) => setEsimVendas(r.vendas)).catch(() => {}),
      smsApi.history().then((r) => setSmsHistory(r.activations)).catch(() => {}),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (navState.newRecargaId) navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 6000);
    return () => clearTimeout(t);
  }, [highlightId]);

  const FINAL = new Set(["feita", "cancelada", "expirada", "reembolsado"]);
  useEffect(() => {
    if (loading) return;
    const pendentes = recargas.filter((r) => !FINAL.has(r.status));
    if (pendentes.length === 0) return;
    let cancelled = false;
    const tick = async () => {
      const updated = await Promise.all(
        pendentes.map((r) => recargasApi.sync(r.id).then((s) => s.recarga).catch(() => r))
      );
      if (cancelled) return;
      setRecargas((prev) => prev.map((r) => updated.find((u) => u.id === r.id) || r));
    };
    const t = setInterval(tick, 5000);
    tick();
    return () => { cancelled = true; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, recargas.length]);

  const label = (s: string) => ({ pendente: "Pendente", andamento: "Em curso", feita: "Feita", cancelada: "Cancelada", expirada: "Expirada", reembolsado: "Reembolsado" } as Record<string, string>)[s] || s;

  const list = (() => {
    if (navState.newRecarga && !recargas.some((r) => r.id === navState.newRecarga!.id)) {
      return [navState.newRecarga, ...recargas];
    }
    return recargas;
  })();

  const tabs: { key: Tab; label: string; icon: any; count: number; gradient: string }[] = [
    { key: "recargas", label: "Recargas", icon: Zap, count: list.length, gradient: "from-violet-500 to-fuchsia-500" },
    { key: "esim", label: "eSIMs", icon: Smartphone, count: esimVendas.length, gradient: "from-cyan-500 to-blue-500" },
    { key: "sms", label: "SMS", icon: MessageSquare, count: smsHistory.length, gradient: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 stat-chip mb-3">
            <HistoryIcon size={12} /> Arquivo de transações
          </div>
          <h1 className="font-display text-4xl">Seu <span className="gradient-text">histórico</span>.</h1>
          <p className="text-sm text-muted-foreground mt-1">Recargas, eSIMs comprados e ativações SMS.</p>
        </div>
      </div>

      {/* Pill tabs */}
      <div className="grid grid-cols-3 gap-2.5">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all ${
                active ? "border-transparent" : "border border-border hover:border-primary/40 bg-card/40"
              }`}
            >
              {active && <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient} opacity-90`} />}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${active ? "bg-white/20 text-white" : "bg-card text-muted-foreground"}`}>
                    <t.icon size={16} />
                  </div>
                  <div>
                    <div className={`text-[10px] uppercase tracking-widest ${active ? "text-white/80" : "text-muted-foreground"}`}>{t.label}</div>
                    <div className={`font-display text-xl tabular ${active ? "text-white" : ""}`}>{t.count}</div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="glass-card p-5 lg:p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 className="animate-spin" size={14} /> Carregando…
          </div>
        ) : tab === "recargas" ? (
          list.length === 0 ? (
            <Empty msg="Nenhuma recarga ainda." />
          ) : (
            <div className="space-y-2">
              {list.map((r) => {
                const hi = highlightId === r.id;
                return (
                  <div key={r.id} className={`grid grid-cols-[1fr_auto_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center rounded-xl px-4 py-3 transition-colors ${
                    hi ? "bg-primary/15 ring-1 ring-primary/40" : "bg-card/40 border border-border/60 hover:border-primary/30"
                  }`}>
                    <div className="hidden sm:block h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
                      {(r.operadora_name || "?")[0]}
                    </div>
                    <div>
                      <div className="font-medium">{r.operadora_name || `#${r.operadora_id}`} · <span className="font-mono tabular text-muted-foreground">{r.phone}</span></div>
                      <div className="text-[11px] font-mono tabular text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</div>
                    </div>
                    <div className="hidden sm:block font-mono tabular font-semibold">R$ {r.amount.toFixed(2)}</div>
                    <div className="sm:hidden font-mono tabular text-xs">R$ {r.amount.toFixed(2)}</div>
                    <div><span className={`pill status-${r.status}`}>{label(r.status)}</span></div>
                  </div>
                );
              })}
            </div>
          )
        ) : tab === "esim" ? (
          esimVendas.length === 0 ? (
            <Empty msg="Nenhum eSIM comprado ainda." />
          ) : (
            <div className="space-y-2">
              {esimVendas.map((v) => (
                <div key={v.id} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center rounded-xl px-4 py-3 bg-card/40 border border-border/60 hover:border-primary/30">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white">
                    <Smartphone size={14} />
                  </div>
                  <div>
                    <div className="font-medium">{v.operadora} · <span className="text-muted-foreground">{v.produto_name}</span></div>
                    <div className="text-[11px] font-mono tabular text-muted-foreground">{v.created_at ? new Date(v.created_at).toLocaleString("pt-BR") : "—"}</div>
                  </div>
                  <div className="font-mono tabular font-semibold">R$ {Number(v.amount).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )
        ) : (
          smsHistory.length === 0 ? (
            <Empty msg="Nenhuma ativação SMS ainda." />
          ) : (
            <div className="space-y-2">
              {smsHistory.map((s) => (
                <div key={s.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center rounded-xl px-4 py-3 bg-card/40 border border-border/60 hover:border-primary/30">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
                    <MessageSquare size={14} />
                  </div>
                  <div>
                    <div className="font-medium">{s.service_name} · <span className="font-mono tabular text-muted-foreground">{s.phone}</span></div>
                    <div className="text-[11px] font-mono tabular text-muted-foreground">{new Date(s.created_at).toLocaleString("pt-BR")}</div>
                  </div>
                  <div className="font-mono tabular text-sm">R$ {Number(s.sale_price).toFixed(2)}</div>
                  <div><span className={`pill status-${s.status}`}>{s.status}</span></div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {trackingId && (
        <RecargaStatusModal
          recargaId={trackingId}
          initial={navState.newRecarga}
          onClose={() => { setTrackingId(null); load(); }}
        />
      )}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">{msg}</div>;
}
