import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { recargasApi, type Recarga } from "@/lib/api";
import { Loader2, RefreshCw } from "lucide-react";
import RecargaStatusModal from "@/components/RecargaStatusModal";
import { toast } from "sonner";

export default function HistoricoPage() {
  const [recargas, setRecargas] = useState<Recarga[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const navState = (location.state || {}) as { newRecargaId?: number; newRecarga?: Recarga };
  const [trackingId, setTrackingId] = useState<number | null>(navState.newRecargaId ?? null);
  const [highlightId, setHighlightId] = useState<number | null>(navState.newRecargaId ?? null);

  const [liveCount, setLiveCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const load = () => {
    recargasApi.list().then((r) => setRecargas(r.recargas)).catch(() => {}).finally(() => setLoading(false));
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const r = await recargasApi.syncAll("mine");
      toast.success(`Sincronizado: ${r.total} pedidos verificados, ${r.changed} atualizados${r.errors ? `, ${r.errors} erros` : ""}`);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Falha ao sincronizar com Poeki");
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

  // Live sync: a cada 5s, consulta Poeki para cada recarga não-final
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

  return (
    <div className="max-w-5xl">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <div className="label-eyebrow">Arquivo</div>
          <h2 className="font-display text-5xl mt-1">Suas recargas.</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncAll}
            disabled={syncing || loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest font-mono border border-foreground hover:bg-paper-2 disabled:opacity-50"
          >
            <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Sincronizando…" : "Sincronizar com Poeki"}
          </button>
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Ao vivo • {liveCount} pendente{liveCount > 1 ? "s" : ""}
            </span>
          )}
          <div className="label-eyebrow tabular">Total: {String(list.length).padStart(3, "0")}</div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={14} /> Carregando…</div>
      ) : list.length === 0 ? (
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
