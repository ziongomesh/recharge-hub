import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { esimApi, type EsimProduto, type EsimVenda } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, ShoppingCart, X } from "lucide-react";
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
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar");
    } finally {
      setLoading(false);
    }
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
      } else {
        toast.error(e.message || "Erro ao comprar");
      }
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="label-eyebrow">Catálogo</div>
      <h1 className="font-display text-5xl mt-2 mb-8">eSIM.</h1>

      {loading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="animate-spin" size={14} /> Carregando…
        </div>
      ) : produtos.length === 0 ? (
        <div className="border border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum eSIM disponível no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {produtos.map((p) => (
            <div key={p.id} className="border border-border bg-card p-5 flex flex-col">
              <div className="label-eyebrow">{p.operadora}</div>
              <div className="font-display text-2xl mt-1">{p.name}</div>
              <div className="font-display text-4xl mt-4 tabular">R$ {p.amount.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">{p.stock} em estoque</div>
              <button
                onClick={() => setConfirm(p)}
                disabled={buying === p.id}
                className="mt-5 inline-flex items-center justify-center gap-2 bg-foreground text-background py-3 text-sm hover:opacity-90 disabled:opacity-50"
              >
                {buying === p.id ? <Loader2 className="animate-spin" size={14} /> : <ShoppingCart size={14} />}
                Comprar
              </button>
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                Ao comprar você concorda com os{" "}
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  termos da iFlash Store
                </button>
                .
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Histórico movido para a página /historico */}

      {/* Confirmar */}
      {confirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={() => setConfirm(null)}>
          <div className="bg-paper border border-border max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="label-eyebrow">Confirmar compra</div>
            <div className="font-display text-2xl mt-2">{confirm.name}</div>
            <div className="text-sm text-muted-foreground">{confirm.operadora}</div>
            <div className="my-4 border-y border-border py-3 flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Valor</span>
              <span className="font-mono tabular text-lg">R$ {confirm.amount.toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-foreground mb-4">
              Será debitado do seu saldo (R$ {(user?.balance ?? 0).toFixed(2)}). Entrega imediata.
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)} className="flex-1 border border-border py-2 text-sm hover:bg-paper-2">
                Cancelar
              </button>
              <button
                onClick={() => buy(confirm)}
                disabled={buying !== null}
                className="flex-1 bg-foreground text-background py-2 text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {buying !== null && <Loader2 className="animate-spin" size={12} />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <EsimQrModal
        open={!!modalVenda}
        onClose={() => { setModalVenda(null); setModalQr(null); }}
        venda={modalVenda}
        qr={modalQr}
      />

      {/* Modal de Termos */}
      {termsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setTermsOpen(false)}
        >
          <div
            className="bg-paper border border-border max-w-lg w-full max-h-[85vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setTermsOpen(false)}
              className="absolute top-3 right-3 p-1 hover:bg-paper-2 rounded"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
            <div className="p-6 pr-12">
              <div className="label-eyebrow">iFlash Store</div>
              <h3 className="font-display text-2xl mt-1 mb-4">Termos de Uso — eSIM</h3>

              <div className="border border-warning/40 bg-warning/5 p-3 text-xs mb-5">
                ⚠️ Ao comprar você declara que leu e concorda com todas as regras da
                <strong> iFlash Store</strong>.
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                Ao adquirir um eSIM conosco, você concorda com as seguintes condições:
              </p>

              <ul className="space-y-2.5 text-sm leading-relaxed">
                <li className="flex gap-2"><span className="text-muted-foreground">•</span><span>Após a ativação, <strong>não há garantia</strong>.</span></li>
                <li className="flex gap-2"><span className="text-muted-foreground">•</span><span>Se o eSIM apresentar erro ou ficar sem sinal na primeira ativação, a troca poderá ser realizada mediante análise.</span></li>
                <li className="flex gap-2"><span className="text-muted-foreground">•</span><span>Trabalhamos com eSIM das operadoras <strong>Vivo (Controle)</strong> e <strong>Claro</strong>.</span></li>
                <li className="flex gap-2"><span className="text-muted-foreground">•</span><span>O eSIM é vinculado a apenas um aparelho. Após ativado, o EID fica associado ao dispositivo, não sendo possível usar em outro.</span></li>
                <li className="flex gap-2"><span className="text-muted-foreground">•</span><span>Não há garantia em casos de uso incorreto, incluindo tentativa de reutilizar o QR Code.</span></li>
                <li className="flex gap-2"><span className="text-muted-foreground">•</span><span>Não garantimos funcionamento em aparelhos que já foram usados anteriormente para ativação de eSIM da Vivo Controle ou Claro.</span></li>
              </ul>

              <button
                onClick={() => setTermsOpen(false)}
                className="mt-6 w-full bg-foreground text-background py-2.5 text-sm hover:opacity-90"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
