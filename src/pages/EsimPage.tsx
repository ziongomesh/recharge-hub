import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { esimApi, esimLogoUrl, type EsimProduto, type EsimVenda, type EsimDddItem } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, ShoppingCart, X, Smartphone, Wifi, Package, AlertTriangle, MapPin, Shuffle, Check, ArrowLeft } from "lucide-react";
import EsimQrModal from "@/components/EsimQrModal";

const OPS = ["Vivo", "Claro", "TIM", "Outras"] as const;

function opGradient(op?: string) {
  const n = (op || "").toLowerCase();
  if (n.includes("vivo")) return "from-violet-500 to-fuchsia-600";
  if (n.includes("claro")) return "from-rose-500 to-red-600";
  if (n.includes("tim")) return "from-blue-500 to-indigo-600";
  return "from-cyan-500 to-blue-600";
}

export default function EsimPage() {
  const [produtos, setProdutos] = useState<EsimProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [opFilter, setOpFilter] = useState<string>("all");
  const [buying, setBuying] = useState(false);
  const [confirm, setConfirm] = useState<EsimProduto | null>(null);
  const [ddds, setDdds] = useState<EsimDddItem[]>([]);
  const [loadingDdds, setLoadingDdds] = useState(false);
  const [dddMode, setDddMode] = useState<"random" | "specific">("random");
  const [selectedDdd, setSelectedDdd] = useState<string>("");
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

  const opCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of produtos) m[p.operadora] = (m[p.operadora] || 0) + 1;
    return m;
  }, [produtos]);

  const visible = useMemo(() => {
    if (opFilter === "all") return produtos;
    return produtos.filter((p) => p.operadora === opFilter);
  }, [produtos, opFilter]);

  const openConfirm = async (p: EsimProduto) => {
    setConfirm(p);
    setDddMode("random");
    setSelectedDdd("");
    setDdds([]);
    setLoadingDdds(true);
    try {
      const r = await esimApi.ddds(p.id);
      setDdds(r.ddds);
    } catch { /* ignore */ }
    finally { setLoadingDdds(false); }
  };

  const dddsWithDdd = useMemo(() => ddds.filter((d) => d.ddd), [ddds]);
  const hasSpecificDdd = dddsWithDdd.length > 0;

  const buy = async () => {
    if (!confirm) return;
    if ((user?.balance ?? 0) < confirm.amount) {
      toast.error("Saldo insuficiente. Faça uma recarga.");
      navigate("/pagamentos");
      return;
    }
    const ddd = dddMode === "specific" ? selectedDdd : null;
    if (dddMode === "specific" && !ddd) { toast.error("Selecione um DDD"); return; }
    setBuying(true);
    try {
      const r = await esimApi.comprar(confirm.id, ddd);
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
    } finally { setBuying(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 stat-chip mb-3">
            <Wifi size={12} /> eSIM digital · entrega imediata
          </div>
          <h1 className="font-display text-4xl">Catálogo <span className="gradient-text">eSIM</span>.</h1>
          <p className="text-sm text-muted-foreground mt-1">Escolha a operadora, o plano e o DDD desejado.</p>
        </div>
        <div className="stat-chip"><Package size={12} /> {produtos.length} produtos</div>
      </div>

      <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 flex items-start gap-2.5 text-sm">
        <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
        <span><strong>Atenção:</strong> garantimos somente a ativação do eSIM. Após ativado, não há garantia.</span>
      </div>

      {/* Filtro por operadora */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setOpFilter("all")}
          className={`px-4 py-2 rounded-full text-xs font-medium border transition ${opFilter === "all" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-card/60"}`}
        >
          Todas <span className="opacity-60">({produtos.length})</span>
        </button>
        {OPS.map((op) => {
          const count = opCounts[op] || 0;
          if (count === 0) return null;
          const active = opFilter === op;
          return (
            <button
              key={op}
              onClick={() => setOpFilter(op)}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition inline-flex items-center gap-2 ${active ? "bg-foreground text-background border-foreground" : "border-border hover:bg-card/60"}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-br ${opGradient(op)}`} />
              {op} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-sm text-muted-foreground flex items-center gap-2 justify-center">
          <Loader2 className="animate-spin" size={14} /> Carregando…
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-card p-12 text-center text-sm text-muted-foreground">
          Nenhum eSIM disponível {opFilter !== "all" ? `para ${opFilter}` : "no momento"}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((p) => (
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

              {p.ddds && p.ddds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.ddds.slice(0, 6).map((d) => (
                    <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-card/60 border border-border tabular">
                      {d}
                    </span>
                  ))}
                  {p.ddds.length > 6 && <span className="text-[10px] text-muted-foreground">+{p.ddds.length - 6}</span>}
                </div>
              )}

              <button
                onClick={() => openConfirm(p)}
                disabled={p.stock === 0}
                className="neon-button mt-5 w-full disabled:opacity-50"
              >
                <ShoppingCart size={14} />
                {p.stock === 0 ? "Esgotado" : "Escolher e comprar"}
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

      {/* Modal de confirmação com escolha de DDD */}
      {confirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur p-4" onClick={() => !buying && setConfirm(null)}>
          <div className="glass-card max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => !buying && setConfirm(null)} className="absolute top-3 right-3 p-1.5 hover:bg-card/60 rounded-lg">
              <X size={18} />
            </button>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Configurar compra</div>
            <div className="font-display text-2xl mt-1">{confirm.name}</div>
            <div className="text-sm text-muted-foreground">{confirm.operadora}</div>

            <div className="my-4 rounded-xl bg-card/60 border border-border p-4 flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Valor</span>
              <span className="font-display text-2xl tabular gradient-text">R$ {confirm.amount.toFixed(2)}</span>
            </div>

            {/* Escolha de DDD */}
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">DDD do número</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDddMode("random")}
                  className={`rounded-xl border p-3 text-left transition ${dddMode === "random" ? "border-primary bg-primary/10" : "border-border hover:bg-card/60"}`}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Shuffle size={14} /> Aleatório
                    {dddMode === "random" && <Check size={12} className="ml-auto text-primary" />}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">Pegamos o primeiro disponível</div>
                </button>
                <button
                  onClick={() => setDddMode("specific")}
                  disabled={!hasSpecificDdd && !loadingDdds}
                  className={`rounded-xl border p-3 text-left transition disabled:opacity-40 disabled:cursor-not-allowed ${dddMode === "specific" ? "border-primary bg-primary/10" : "border-border hover:bg-card/60"}`}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin size={14} /> Específico
                    {dddMode === "specific" && <Check size={12} className="ml-auto text-primary" />}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {loadingDdds ? "Carregando…" : hasSpecificDdd ? "Escolha o DDD" : "Sem DDDs definidos"}
                  </div>
                </button>
              </div>

              {dddMode === "specific" && (
                <div className="rounded-xl border border-border p-3">
                  {loadingDdds ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="animate-spin" size={12} /> Carregando DDDs…</div>
                  ) : dddsWithDdd.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Este produto não possui DDDs específicos. Use a opção Aleatório.</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {dddsWithDdd.map((d) => (
                        <button
                          key={d.ddd}
                          onClick={() => setSelectedDdd(d.ddd)}
                          className={`px-3 py-1.5 rounded-lg text-xs tabular border transition ${selectedDdd === d.ddd ? "bg-foreground text-background border-foreground" : "border-border hover:bg-card/60"}`}
                        >
                          {d.ddd} <span className="opacity-60">·{d.stock}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground mt-4 mb-3">
              Saldo atual: <strong className="text-foreground">R$ {(user?.balance ?? 0).toFixed(2)}</strong>. Entrega imediata.
            </div>
            <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs flex items-start gap-2 mb-4">
              <AlertTriangle size={13} className="text-warning shrink-0 mt-0.5" />
              <span>Garantimos <strong>somente a ativação</strong>. Após ativado, não há garantia.</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)} disabled={buying} className="flex-1 rounded-full border border-border py-2.5 text-sm hover:bg-card/60 transition inline-flex items-center justify-center gap-2">
                <ArrowLeft size={13} /> Voltar
              </button>
              <button onClick={buy} disabled={buying || (dddMode === "specific" && !selectedDdd)} className="neon-button flex-1 disabled:opacity-50">
                {buying ? <Loader2 className="animate-spin" size={12} /> : <ShoppingCart size={12} />}
                Confirmar compra
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
