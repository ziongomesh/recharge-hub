import { useState, useEffect, useRef } from "react";
import { pagamentosApi, type Pagamento } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Copy, ArrowUpRight } from "lucide-react";

export default function PagamentosPage() {
  const { refreshUser } = useAuth();
  const [tab, setTab] = useState<"depositar" | "historico">("depositar");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<{ qrCodeBase64: string; pixCopiaECola: string; txId: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

  useEffect(() => { if (tab === "historico") pagamentosApi.list().then((r) => setPagamentos(r.pagamentos)).catch(() => {}); }, [tab]);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const deposit = async () => {
    const v = parseFloat(amount);
    if (!v || v < 1) return toast.error("Valor mínimo: R$ 1,00");
    setLoading(true);
    try {
      const r = await pagamentosApi.deposit(v);
      setPix({ qrCodeBase64: r.qrCodeBase64, pixCopiaECola: r.pixCopiaECola, txId: r.pagamento.transaction_id });
      pollRef.current = setInterval(async () => {
        try {
          const s = await pagamentosApi.checkStatus(r.pagamento.transaction_id);
          if (s.status === "paid") {
            clearInterval(pollRef.current!);
            setConfirmed(true); await refreshUser(); toast.success("Pagamento confirmado!");
          }
        } catch {}
      }, 3000);
    } catch (e: any) { toast.error(e.message || "Erro ao gerar PIX"); }
    finally { setLoading(false); }
  };

  const copy = () => { if (pix) { navigator.clipboard.writeText(pix.pixCopiaECola); toast.success("Código PIX copiado!"); } };
  const reset = () => { setPix(null); setConfirmed(false); setAmount(""); if (pollRef.current) clearInterval(pollRef.current); };

  const TabBtn = ({ k, label }: { k: typeof tab; label: string }) => (
    <button onClick={() => setTab(k)}
      className={`pb-2 border-b-2 transition-colors text-sm ${tab === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
      {label}
    </button>
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-6 border-b border-border mb-10">
        <TabBtn k="depositar" label="Depositar" />
        <TabBtn k="historico" label="Histórico" />
      </div>

      {tab === "depositar" && !pix && !confirmed && (
        <div className="max-w-md">
          <div className="label-eyebrow">Depósito · PIX</div>
          <h2 className="font-display text-5xl mt-2 mb-8">Adicionar saldo.</h2>
          <label className="label-eyebrow block mb-2">Valor (R$)</label>
          <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="w-full bg-transparent border-b-2 border-foreground/30 focus:border-foreground py-3 font-display text-5xl tabular outline-none" />
          <button onClick={deposit} disabled={loading}
            className="mt-8 inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm disabled:opacity-50">
            {loading && <Loader2 className="animate-spin" size={14} />}
            Gerar PIX <ArrowUpRight size={16} />
          </button>
        </div>
      )}

      {tab === "depositar" && pix && !confirmed && (
        <div className="grid md:grid-cols-2 gap-10 max-w-3xl">
          <div className="border border-foreground p-6">
            <div className="label-eyebrow mb-3">QR Code</div>
            {pix.qrCodeBase64 && <img src={pix.qrCodeBase64} alt="QR" className="w-full max-w-xs mx-auto" />}
          </div>
          <div>
            <div className="label-eyebrow">Aguardando</div>
            <h3 className="font-display text-4xl mt-2 mb-6">Pague o PIX <em className="italic">para creditar</em>.</h3>
            <label className="label-eyebrow block mb-2">Copia &amp; cola</label>
            <div className="flex gap-2">
              <input value={pix.pixCopiaECola} readOnly className="field font-mono text-xs" />
              <button onClick={copy} className="border border-foreground px-3 hover:bg-foreground hover:text-background transition-colors"><Copy size={14} /></button>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" size={14} /> Aguardando confirmação…
            </div>
          </div>
        </div>
      )}

      {tab === "depositar" && confirmed && (
        <div className="max-w-xl border border-foreground p-10">
          <div className="label-eyebrow">Confirmado</div>
          <h2 className="font-display text-5xl mt-2">Saldo <em className="italic">creditado</em>.</h2>
          <p className="text-ink-soft mt-4 text-sm">Pronto para usar em recargas.</p>
          <button onClick={reset} className="mt-8 inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm">
            Novo depósito <ArrowUpRight size={14} />
          </button>
        </div>
      )}

      {tab === "historico" && (
        <div className="border-t-2 border-foreground">
          <div className="grid grid-cols-12 gap-4 py-3 label-eyebrow border-b border-border">
            <div className="col-span-2">№</div>
            <div className="col-span-4">Data</div>
            <div className="col-span-3">Valor</div>
            <div className="col-span-3 text-right">Status</div>
          </div>
          {pagamentos.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">Nenhum pagamento registrado.</div>
          ) : pagamentos.map((p, i) => (
            <div key={p.id} className="grid grid-cols-12 gap-4 py-4 border-b border-border items-center text-sm">
              <div className="col-span-2 font-mono tabular text-muted-foreground">{String(i + 1).padStart(3, "0")}</div>
              <div className="col-span-4 font-mono tabular">{new Date(p.created_at).toLocaleDateString("pt-BR")}</div>
              <div className="col-span-3 font-mono tabular">R$ {p.amount.toFixed(2)}</div>
              <div className="col-span-3 text-right">
                <span className={`pill status-${p.status}`}>{p.status === "paid" ? "Pago" : p.status === "pending" ? "Pendente" : "Falhou"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
