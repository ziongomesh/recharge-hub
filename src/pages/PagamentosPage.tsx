import { useState, useEffect, useRef } from "react";
import { pagamentosApi, type Pagamento } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Copy, ArrowUpRight, TrendingUp, Wallet, QrCode, CheckCircle2 } from "lucide-react";

export default function PagamentosPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<"depositar" | "historico">("depositar");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<{ qrCode: string; qrCodeBase64: string; pixCopiaECola: string; txId: string; amount: number } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

  useEffect(() => { if (tab === "historico") pagamentosApi.list("limit=1000").then((r) => setPagamentos(r.pagamentos)).catch(() => {}); }, [tab]);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const deposit = async () => {
    const v = parseFloat(amount);
    if (!v || v < 1) return toast.error("Valor mínimo: R$ 1,00");
    setLoading(true);
    try {
      const r = await pagamentosApi.deposit(v);
      setPix({ qrCode: r.qrCode, qrCodeBase64: r.qrCodeBase64, pixCopiaECola: r.pixCopiaECola, txId: r.pagamento.transaction_id, amount: v });
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
  const formatMoney = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const balanceTimeline = pagamentos
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .reduce<Array<Pagamento & { balanceBefore: number; balanceAfter: number }>>((items, pagamento) => {
      const balanceBefore = items.at(-1)?.balanceAfter ?? 0;
      const balanceAfter = pagamento.status === "paid" ? balanceBefore + pagamento.amount : balanceBefore;
      items.push({ ...pagamento, balanceBefore, balanceAfter });
      return items;
    }, []);

  const presets = [10, 25, 50, 100, 200, 500];

  return (
    <div className="space-y-6">
      {/* Hero balance */}
      <section className="relative overflow-hidden rounded-3xl p-8 lg:p-10 bg-gradient-to-br from-primary/25 via-accent/15 to-card border border-primary/30">
        <div className="absolute -top-32 -right-20 w-80 h-80 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-accent/25 blur-3xl pointer-events-none" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 stat-chip mb-3">
              <Wallet size={12} /> Carteira CometaSMS
            </div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Saldo disponível</div>
            <div className="font-display text-6xl mt-1 tabular gradient-text">R$ {(user?.balance ?? 0).toFixed(2)}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab("depositar")} className={`neon-button ${tab === "depositar" ? "" : "opacity-80"}`}>
              Depositar <ArrowUpRight size={14} />
            </button>
            <button onClick={() => setTab("historico")} className={`px-5 py-2.5 rounded-full text-sm border border-border bg-card/60 hover:border-primary/50 transition ${tab === "historico" ? "border-primary/60" : ""}`}>
              Extrato
            </button>
          </div>
        </div>
      </section>

      {tab === "depositar" && !pix && !confirmed && (
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <div className="glass-card p-7">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Depósito · PIX</div>
            <h2 className="font-display text-3xl mt-1 mb-6">Quanto deseja adicionar?</h2>

            <div className="grid grid-cols-3 gap-2 mb-5">
              {presets.map((v) => (
                <button key={v} onClick={() => setAmount(String(v))}
                  className={`py-3 rounded-xl text-sm font-medium border transition ${
                    amount === String(v) ? "border-primary bg-primary/10 text-primary" : "border-border bg-card/40 hover:border-primary/40"
                  }`}>
                  R$ {v}
                </button>
              ))}
            </div>

            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Valor personalizado</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">R$</span>
              <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full bg-card/60 border border-border focus:border-primary rounded-2xl pl-12 pr-4 py-4 font-display text-3xl tabular outline-none transition" />
            </div>

            <button onClick={deposit} disabled={loading} className="neon-button mt-6 w-full py-3.5 disabled:opacity-50">
              {loading && <Loader2 className="animate-spin" size={14} />}
              Gerar QR Code PIX <QrCode size={16} />
            </button>
          </div>

          <div className="glass-card p-7 space-y-4">
            <h3 className="font-display text-xl">Como funciona</h3>
            {[
              ["1", "Escolha o valor", "Selecione um preset ou digite o valor desejado."],
              ["2", "Pague o PIX", "Escaneie o QR Code ou cole o código."],
              ["3", "Saldo cai na hora", "Confirmação automática em segundos."],
            ].map(([n, t, d]) => (
              <div key={n} className="flex gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-display">{n}</div>
                <div>
                  <div className="font-medium text-sm">{t}</div>
                  <div className="text-xs text-muted-foreground">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "depositar" && pix && !confirmed && (() => {
        const qrSrc = pix.qrCodeBase64
          ? (pix.qrCodeBase64.startsWith("data:") ? pix.qrCodeBase64 : `data:image/png;base64,${pix.qrCodeBase64}`)
          : pix.qrCode || (pix.pixCopiaECola ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pix.pixCopiaECola)}` : "");
        return (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-7 flex flex-col items-center justify-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">QR Code</div>
              {qrSrc ? (
                <div className="p-4 rounded-2xl bg-white">
                  <img src={qrSrc} alt="QR Code PIX" className="w-56 h-56 block" />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-10">QR indisponível — use o código abaixo.</div>
              )}
            </div>
            <div className="glass-card p-7">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Aguardando</div>
              <h3 className="font-display text-2xl mt-1 mb-5">Pague o PIX para creditar.</h3>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Código copia &amp; cola</label>
              <div className="flex gap-2">
                <input value={pix.pixCopiaECola} readOnly className="flex-1 bg-card/60 border border-border rounded-xl px-3 py-2.5 font-mono text-xs outline-none" />
                <button onClick={copy} className="neon-button !px-4"><Copy size={14} /></button>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="animate-spin" size={14} /> Aguardando confirmação…
              </div>
            </div>
          </div>
        );
      })()}

      {tab === "depositar" && confirmed && (
        <div className="glass-card p-10 text-center max-w-xl mx-auto">
          <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-success to-success/70 flex items-center justify-center mb-4">
            <CheckCircle2 className="text-white" size={32} />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Confirmado</div>
          <h2 className="font-display text-4xl mt-1 gradient-text">Saldo creditado!</h2>
          <p className="text-muted-foreground mt-3 text-sm">Pronto para usar em recargas, SMS e eSIMs.</p>
          <button onClick={reset} className="neon-button mt-6">
            Novo depósito <ArrowUpRight size={14} />
          </button>
        </div>
      )}

      {tab === "historico" && (
        <div className="glass-card p-7">
          <div className="flex items-end justify-between gap-4 border-b border-border pb-5 mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Linha do tempo</div>
              <h2 className="font-display text-2xl mt-1">Extrato da carteira</h2>
            </div>
            <div className="hidden sm:inline-flex stat-chip">
              <TrendingUp size={13} className="text-primary" />
              {formatMoney(balanceTimeline.at(-1)?.balanceAfter ?? 0)}
            </div>
          </div>
          {pagamentos.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">Nenhum pagamento registrado.</div>
          ) : (
            <div className="space-y-2">
              {balanceTimeline.slice().reverse().map((p) => (
                <div key={p.id} className="grid gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-sm sm:grid-cols-[1fr_140px_140px_120px] sm:items-center">
                  <div>
                    <div className="font-medium">{p.status === "paid" ? "Saldo creditado" : p.status === "pending" ? "Aguardando pagamento" : "Pagamento falhou"}</div>
                    <div className="mt-1 font-mono text-xs tabular text-muted-foreground">{new Date(p.created_at).toLocaleString("pt-BR")}</div>
                  </div>
                  <div className="font-mono tabular text-muted-foreground text-xs">antes: {formatMoney(p.balanceBefore)}</div>
                  <div className="font-mono tabular font-semibold">depois: {formatMoney(p.balanceAfter)}</div>
                  <div className="sm:text-right">
                    <span className={`pill status-${p.status}`}>{p.status === "paid" ? `+ ${formatMoney(p.amount)}` : p.status === "pending" ? "Pendente" : "Falhou"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
