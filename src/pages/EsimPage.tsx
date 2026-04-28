import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { esimApi, esimLogoUrl, type EsimProduto, type EsimVenda } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, ShoppingCart, X, Smartphone, Wifi, Package, AlertTriangle } from "lucide-react";
import EsimQrModal from "@/components/EsimQrModal";

export default function EsimPage() {
  const [produtos, setProdutos] = useState<EsimProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<EsimProduto | null>(null);
  const [modalVenda, setModalVenda] = useState<EsimVenda | null>(null);
  const [modalQr, setModalQr] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { produtos: p } = await esimApi.produtos();
      setProdutos(p);
    } catch (e: any) { toast.error(e.message || "Erro ao carregar"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const buy = async (p: EsimProduto) => {
    if ((user?.balance ?? 0) < p.amount) {
      toast.error("Saldo insuficiente. Faça uma recarga.");
      navigate("/pagamentos");
      return;
    }
    setBuying(p.id);
    try {
      const r = await esimApi.comprar(p.id);
      setModalVenda(r.venda);
      setModalQr(r.qr);
      setConfirm(null);
      await refreshUser?.();
      load();
    } catch (e: any) {
      if (e.message?.toLowerCase().includes("saldo")) {
        toast.error("Saldo insuficiente. Faça uma recarga.");
        navigate("/pagamentos");
      } else toast.error(e.message || "Erro ao comprar");
    } finally { setBuying(null); }
  };

  const opGradient = (op?: string) => {
    const n = (op || "").toLowerCase();
    if (n.includes("vivo")) return "from-violet-500 to-fuchsia-600";
    if (n.includes("claro")) return "from-rose-500 to-red-600";
    if (n.includes("tim")) return "from-blue-500 to-indigo-600";
    return "from-cyan-500 to-blue-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 stat-chip mb-3">
            <Wifi size={12} /> eSIM digital · entrega imediata
          </div>
          <h1 className="font-display text-4xl">Catálogo <span className="gradient-text">eSIM</span>.</h1>
          <p className="text-sm text-muted-foreground mt-1">Ative uma linha brasileira em minutos, sem chip físico.</p>
        </div>
        <div className="stat-chip"><Package size={12} /> {produtos.length} produtos</div>
      </div>

      <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 flex items-start gap-2.5 text-sm">
        <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
        <span><strong>Atenção:</strong> assim que você ativar seu eSIM, não damos garantia.</span>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-sm text-muted-foreground flex items-center gap-2 justify-center">
          <Loader2 className="animate-spin" size={14} /> Carregando…
        </div>
      ) : produtos.length === 0 ? (
        <div className="glass-card p-12 text-center text-sm text-muted-foreground">
          Nenhum eSIM disponível no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {produtos.map((p) => (
            <div key={p.id} className="glass-card glass-card-hover p-6 flex flex-col relative overflow-hidden">
              <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${opGradient(p.operadora)} opacity-25 blur-3xl pointer-events-none`} />
              <div className="relative flex items-start justify-between">
                <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${opGradient(p.operadora)} flex items-center justify-center text-white shadow-lg overflow-hidden`}>
                  {p.logo_image ? (
                    <img src={esimLogoUrl(p.id, p.logo_image) || ""} alt={p.name} className="w-full h-full object-contain bg-white/95 p-1" />
                  ) : (
                    <Smartphone size={18} />
                  )}
                </div>
                <span className="stat-chip text-[10px]">{p.stock} em estoque</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-4">{p.operadora}</div>
              <div className="font-display text-xl mt-1 leading-tight">{p.name}</div>
              <div className="font-display text-4xl mt-4 tabular gradient-text">R$ {p.amount.toFixed(2)}</div>

              <button
                onClick={() => setConfirm(p)}
                disabled={buying === p.id || p.stock === 0}
                className="neon-button mt-5 w-full disabled:opacity-50"
              >
                {buying === p.id ? <Loader2 className="animate-spin" size={14} /> : <ShoppingCart size={14} />}
                {p.stock === 0 ? "Esgotado" : "Comprar agora"}
              </button>
              <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                Ao comprar você concorda com os{" "}
                <button onClick={() => setTermsOpen(true)} className="underline underline-offset-2 hover:text-foreground">
                  termos da CometaSMS
                </button>.
              </p>
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur p-4" onClick={() => setConfirm(null)}>
          <div className="glass-card max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Confirmar compra</div>
            <div className="font-display text-2xl mt-1">{confirm.name}</div>
            <div className="text-sm text-muted-foreground">{confirm.operadora}</div>
            <div className="my-4 rounded-xl bg-card/60 border border-border p-4 flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Valor</span>
              <span className="font-display text-2xl tabular gradient-text">R$ {confirm.amount.toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              Será debitado do seu saldo (R$ {(user?.balance ?? 0).toFixed(2)}). Entrega imediata.
            </div>
            <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs flex items-start gap-2 mb-4">
              <AlertTriangle size={13} className="text-warning shrink-0 mt-0.5" />
              <span>Assim que você ativar seu eSIM, <strong>não damos garantia</strong>.</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)} className="flex-1 rounded-full border border-border py-2.5 text-sm hover:bg-card/60 transition">
                Cancelar
              </button>
              <button onClick={() => buy(confirm)} disabled={buying !== null} className="neon-button flex-1 disabled:opacity-50">
                {buying !== null && <Loader2 className="animate-spin" size={12} />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <EsimQrModal open={!!modalVenda} onClose={() => { setModalVenda(null); setModalQr(null); }} venda={modalVenda} qr={modalQr} />

      {termsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur p-4" onClick={() => setTermsOpen(false)}>
          <div className="glass-card max-w-lg w-full max-h-[85vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setTermsOpen(false)} className="absolute top-3 right-3 p-1.5 hover:bg-card/60 rounded-lg">
              <X size={18} />
            </button>
            <div className="p-6 pr-12">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">CometaSMS</div>
              <h3 className="font-display text-2xl mt-1 mb-4">Termos de Uso — eSIM</h3>
              <div className="border border-warning/40 bg-warning/10 rounded-xl p-3 text-xs mb-5">
                ⚠️ Ao comprar você declara que leu e concorda com todas as regras da <strong>CometaSMS</strong>.
              </div>
              <ul className="space-y-2.5 text-sm leading-relaxed">
                <li className="flex gap-2"><span className="text-primary">•</span><span>Após a ativação, <strong>não há garantia</strong>.</span></li>
                <li className="flex gap-2"><span className="text-primary">•</span><span>Erro ou sem sinal na primeira ativação: troca mediante análise.</span></li>
                <li className="flex gap-2"><span className="text-primary">•</span><span>Operadoras: <strong>Vivo (Controle)</strong> e <strong>Claro</strong>.</span></li>
                <li className="flex gap-2"><span className="text-primary">•</span><span>O eSIM é vinculado a um único aparelho (EID).</span></li>
                <li className="flex gap-2"><span className="text-primary">•</span><span>Sem garantia em caso de uso incorreto ou QR reaproveitado.</span></li>
                <li className="flex gap-2"><span className="text-primary">•</span><span>Sem garantia em aparelhos já usados para Vivo Controle ou Claro.</span></li>
              </ul>
              <button onClick={() => setTermsOpen(false)} className="neon-button mt-6 w-full">Entendi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
