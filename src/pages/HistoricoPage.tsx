import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { recargasApi, esimApi, smsApi, type Recarga, type EsimVenda, type SmsActivation } from "@/lib/api";
import { Loader2, RefreshCw } from "lucide-react";
import RecargaStatusModal from "@/components/RecargaStatusModal";
import { toast } from "sonner";

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

  const [liveCount, setLiveCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      recargasApi.list().then((r) => setRecargas(r.recargas)).catch(() => {}),
      esimApi.minhas().then((r) => setEsimVendas(r.vendas)).catch(() => {}),
      smsApi.history().then((r) => setSmsHistory(r.activations)).catch(() => {}),
    ]).finally(() => setLoading(false));
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const r = await recargasApi.syncAll("mine");
      toast.success(`Sincronizado: ${r.total} pedidos verificados, ${r.changed} atualizados${r.errors ? `, ${r.errors} erros` : ""}`);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Falha ao sincronizar com a API");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Clear router state once consumed so a refresh doesn't reopen the modal
  useEffect(() => {
    if (navState.newRecargaId) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fade highlight after 6s
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 6000);
    return () => clearTimeout(t);
  }, [highlightId]);

  // Live sync: a cada 5s, consulta a API para cada recarga não-final
  const FINAL = new Set(["feita", "cancelada", "expirada", "reembolsado"]);
  useEffect(() => {
    if (loading) return;
    const pendentes = recargas.filter((r) => !FINAL.has(r.status));
    setLiveCount(pendentes.length);
    if (pendentes.length === 0) return;

    let cancelled = false;
    const tick = async () => {
      const updated = await Promise.all(
        pendentes.map((r) =>
          recargasApi.sync(r.id).then((s) => s.recarga).catch(() => r)
        )
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

  // If tracked recarga isn't in the list yet, prepend the optimistic one
  const list = (() => {
    if (navState.newRecarga && !recargas.some((r) => r.id === navState.newRecarga!.id)) {
      return [navState.newRecarga, ...recargas];
    }
    return recargas;
  })();

  const totalByTab = tab === "recargas" ? list.length : tab === "esim" ? esimVendas.length : smsHistory.length;

  return (
    <div className="max-w-5xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <div className="label-eyebrow">Arquivo</div>
          <h2 className="font-display text-5xl mt-1">Seu histórico.</h2>
        </div>
        <div className="flex items-center gap-3">
          {tab === "recargas" && (
            <button
              onClick={handleSyncAll}
              disabled={syncing || loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest font-mono border border-foreground hover:bg-paper-2 disabled:opacity-50"
            >
              <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Sincronizando…" : "Sincronizar com API"}
            </button>
          )}
          {tab === "recargas" && liveCount > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Ao vivo • {liveCount} pendente{liveCount > 1 ? "s" : ""}
            </span>
          )}
          <div className="label-eyebrow tabular">Total: {String(totalByTab).padStart(3, "0")}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {([
          ["recargas", `Recargas (${list.length})`],
          ["esim", `eSIMs (${esimVendas.length})`],
          ["sms", `SMS (${smsHistory.length})`],
        ] as [Tab, string][]).map(([key, lbl]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-mono border-b-2 -mb-px transition-colors ${
              tab === key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={14} /> Carregando…</div>
      ) : tab === "recargas" ? (
        list.length === 0 ? (
          <div className="border border-dashed border-border p-10 text-center text-muted-foreground text-sm">Nenhuma recarga ainda.</div>
        ) : (
          <div className="border-t-2 border-foreground">
            <div className="grid grid-cols-12 gap-4 py-3 label-eyebrow border-b border-border">
              <div className="col-span-1">№</div>
              <div className="col-span-2">Data</div>
              <div className="col-span-2">Operadora</div>
              <div className="col-span-3">Número</div>
              <div className="col-span-2">Valor</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {list.map((r, i) => {
              const isHighlighted = highlightId === r.id;
              return (
                <div
                  key={r.id}
                  className={`grid grid-cols-12 gap-4 py-4 border-b border-border items-center text-sm transition-colors ${
                    isHighlighted ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-paper-2/60"
                  }`}
                >
                  <div className="col-span-1 font-mono tabular text-muted-foreground">{String(i + 1).padStart(3, "0")}</div>
                  <div className="col-span-2 font-mono tabular">{new Date(r.created_at).toLocaleDateString("pt-BR")}</div>
                  <div className="col-span-2 font-display text-lg">{r.operadora_name || `#${r.operadora_id}`}</div>
                  <div className="col-span-3 font-mono tabular">{r.phone}</div>
                  <div className="col-span-2 font-mono tabular">R$ {r.amount.toFixed(2)}</div>
                  <div className="col-span-2 text-right">
                    <span className={`pill status-${r.status}`}>{label(r.status)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : tab === "esim" ? (
        esimVendas.length === 0 ? (
          <div className="border border-dashed border-border p-10 text-center text-muted-foreground text-sm">Nenhum eSIM comprado ainda.</div>
        ) : (
          <div className="border-t-2 border-foreground">
            <div className="grid grid-cols-12 gap-4 py-3 label-eyebrow border-b border-border">
              <div className="col-span-1">№</div>
              <div className="col-span-3">Data</div>
              <div className="col-span-2">Operadora</div>
              <div className="col-span-4">Produto</div>
              <div className="col-span-2 text-right">Valor</div>
            </div>
            {esimVendas.map((v, i) => (
              <div key={v.id} className="grid grid-cols-12 gap-4 py-4 border-b border-border items-center text-sm hover:bg-paper-2/60">
                <div className="col-span-1 font-mono tabular text-muted-foreground">{String(i + 1).padStart(3, "0")}</div>
                <div className="col-span-3 font-mono tabular">{v.created_at ? new Date(v.created_at).toLocaleString("pt-BR") : "—"}</div>
                <div className="col-span-2 font-display text-lg">{v.operadora}</div>
                <div className="col-span-4">{v.produto_name}</div>
                <div className="col-span-2 text-right font-mono tabular">R$ {Number(v.amount).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )
      ) : (
        smsHistory.length === 0 ? (
          <div className="border border-dashed border-border p-10 text-center text-muted-foreground text-sm">Nenhuma ativação SMS ainda.</div>
        ) : (
          <div className="border-t-2 border-foreground">
            <div className="grid grid-cols-12 gap-4 py-3 label-eyebrow border-b border-border">
              <div className="col-span-1">№</div>
              <div className="col-span-3">Data</div>
              <div className="col-span-2">Serviço</div>
              <div className="col-span-3">Número</div>
              <div className="col-span-1 text-right">Valor</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {smsHistory.map((s, i) => (
              <div key={s.id} className="grid grid-cols-12 gap-4 py-4 border-b border-border items-center text-sm hover:bg-paper-2/60">
                <div className="col-span-1 font-mono tabular text-muted-foreground">{String(i + 1).padStart(3, "0")}</div>
                <div className="col-span-3 font-mono tabular">{new Date(s.created_at).toLocaleString("pt-BR")}</div>
                <div className="col-span-2">{s.service_name}</div>
                <div className="col-span-3 font-mono tabular">{s.phone}</div>
                <div className="col-span-1 text-right font-mono tabular">R$ {Number(s.sale_price).toFixed(2)}</div>
                <div className="col-span-2 text-right">
                  <span className={`pill status-${s.status}`}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {trackingId && (
        <RecargaStatusModal
          recargaId={trackingId}
          initial={navState.newRecarga}
          onClose={() => {
            setTrackingId(null);
            load(); // refresh list to reflect final status
          }}
        />
      )}
    </div>
  );
}
