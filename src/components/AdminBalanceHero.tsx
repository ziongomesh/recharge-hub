import { useEffect, useState } from "react";
import { RefreshCw, Wallet, AlertTriangle } from "lucide-react";

interface Props {
  /** Rótulo exibido (ex: "Provedor SMS", "API de Recargas", "Provedor PIX") */
  label: string;
  /** Função que retorna o saldo em BRL (e opcionalmente extra info) */
  fetcher: () => Promise<{ balance: number | null; extra?: string | null }>;
  /** Limiar pra alerta de saldo baixo (BRL). Default 50 */
  lowThreshold?: number;
  /** Auto refresh em ms (default 60000). Passe 0 pra desligar. */
  refreshMs?: number;
}

export default function AdminBalanceHero({ label, fetcher, lowThreshold = 50, refreshMs = 60000 }: Props) {
  const [balance, setBalance] = useState<number | null>(null);
  const [extra, setExtra] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const r = await fetcher();
      const n = typeof r.balance === "number" ? r.balance : Number(r.balance);
      if (!Number.isFinite(n)) {
        setErrorMsg("Resposta inválida da API");
        setBalance(null);
      } else {
        setBalance(n);
        setExtra(r.extra ?? null);
        setLastUpdate(new Date());
      }
    } catch (e: any) {
      const raw = e?.message || "Falha";
      const friendly = raw.includes("Failed to fetch")
        ? "Backend offline"
        : raw.includes("HTML em vez de JSON")
          ? "URL da API inválida"
          : raw;
      setErrorMsg(friendly);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (refreshMs > 0) {
      const t = setInterval(load, refreshMs);
      return () => clearInterval(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const low = balance !== null && balance < lowThreshold;

  return (
    <div className={`relative overflow-hidden border-2 rounded-lg p-8 md:p-10 ${
      errorMsg ? "border-destructive/40 bg-destructive/5" :
      low ? "border-amber-500/50 bg-amber-50/40 dark:bg-amber-950/10" :
      "border-foreground bg-paper-2"
    }`}>
      <Wallet className="absolute -right-4 -bottom-4 opacity-[0.04]" size={180} strokeWidth={1} />
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 label-eyebrow">
            <span className={`w-2 h-2 rounded-full ${
              errorMsg ? "bg-destructive" : loading ? "bg-amber-500 animate-pulse" : "bg-success animate-pulse"
            }`} />
            Saldo {label}
            {low && !errorMsg && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 normal-case tracking-normal text-[11px] ml-2">
                <AlertTriangle size={11} /> saldo baixo
              </span>
            )}
          </div>

          <div className="mt-3 flex items-baseline gap-3">
            {errorMsg ? (
              <div className="font-display text-3xl md:text-4xl text-destructive">{errorMsg}</div>
            ) : (
              <span className="font-display text-5xl md:text-7xl tabular leading-none">
                {loading && balance === null ? "···" : `R$ ${(balance ?? 0).toFixed(2)}`}
              </span>
            )}
          </div>

          <div className="mt-3 text-xs text-muted-foreground font-mono-x">
            {extra && <span className="mr-2">{extra} ·</span>}
            {lastUpdate
              ? `Atualizado às ${lastUpdate.toLocaleTimeString("pt-BR")} · auto-refresh ${Math.round(refreshMs / 1000)}s`
              : "Carregando…"}
          </div>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-5 py-3 border-2 border-foreground hover:bg-foreground hover:text-background transition text-sm font-mono-x uppercase tracking-widest disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>
    </div>
  );
}
