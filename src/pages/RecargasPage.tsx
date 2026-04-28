import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { recargasApi, planosApi, operadorasApi, type Operadora, type Plano } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, Check, Loader2, AlertTriangle, Clock, Zap, Smartphone } from "lucide-react";

const fmtPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const raw = (v: string) => v.replace(/\D/g, "");

export default function RecargasPage() {
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);
  const [phone, setPhone] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [detectedOp, setDetectedOp] = useState<string | null>(null);
  const [selectedOp, setSelectedOp] = useState<Operadora | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loadingPlanos, setLoadingPlanos] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<Plano | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const navigate = useNavigate();
  const detectSeqRef = useRef(0);

  useEffect(() => {
    operadorasApi.list().then((r) => setOperadoras(r.operadoras.filter((o) => o.enabled)))
      .catch(() => setOperadoras([
        { id: 1, name: "Claro", enabled: true },
        { id: 2, name: "TIM", enabled: true },
        { id: 3, name: "Vivo", enabled: true },
      ]));
  }, []);

  const loadPlanos = async (id: number) => {
    setLoadingPlanos(true);
    try {
      const { planos } = await planosApi.listByOperadora(id);
      setPlanos(planos);
      if (!planos.length) toast.error("Nenhum plano cadastrado para essa operadora.");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar planos");
      setPlanos([]);
    } finally { setLoadingPlanos(false); }
  };

  const detect = useCallback(async (digits: string, seq: number) => {
    if (digits.length < 10) return;
    setDetectedOp(null); setSelectedOp(null); setPlanos([]); setSelectedPlano(null);
    try {
      const r = await recargasApi.detectOperator(digits);
      if (seq !== detectSeqRef.current) return;
      if (r.operator) {
        const name = r.operator.charAt(0).toUpperCase() + r.operator.slice(1).toLowerCase();
        setDetectedOp(name);
        const op = operadoras.find((o) => o.name.toLowerCase() === r.operator.toLowerCase());
        if (op) { setSelectedOp(op); loadPlanos(op.id); }
        else toast.error(`Operadora ${name} não habilitada`);
      } else toast.error(r.message || "Operadora não identificada");
    } catch (e: any) {
      if (seq !== detectSeqRef.current) return;
      toast.error(e.message || "Erro ao detectar operadora");
    } finally {
      if (seq === detectSeqRef.current) setDetecting(false);
    }
  }, [operadoras]);

  const onPhone = (v: string) => setPhone(fmtPhone(v));

  useEffect(() => {
    const d = raw(phone);
    detectSeqRef.current += 1;
    const seq = detectSeqRef.current;
    if (d.length < 10) {
      setDetecting(false); setDetectedOp(null); setSelectedOp(null); setPlanos([]); setSelectedPlano(null);
      return;
    }
    setDetecting(true);
    const timer = window.setTimeout(() => { void detect(d, seq); }, 900);
    return () => window.clearTimeout(timer);
  }, [phone, detect]);

  const pickPlano = async (p: Plano) => {
    const d = raw(phone);
    if (d.length < 10) return;
    setSelectedPlano(p); setLoading(true);
    try {
      const r = await recargasApi.checkPhone(d, selectedOp?.name.toLowerCase());
      if (r.isBlacklisted) { toast.error("Número na blacklist"); setSelectedPlano(null); }
      else if (r.isCooldown) { toast.error(r.message); setSelectedPlano(null); }
      else setStep("confirm");
    } catch (e: any) { toast.error(e.message || "Erro"); setSelectedPlano(null); }
    finally { setLoading(false); }
  };

  const confirm = async () => {
    if (!selectedOp || !selectedPlano) return;
    setLoading(true);
    try {
      const { recarga } = await recargasApi.create({
        operadora_id: selectedOp.id, phone: raw(phone), plano_id: selectedPlano.id,
      });
      toast.success("Recarga solicitada!");
      navigate("/historico", { state: { newRecargaId: recarga.id, newRecarga: recarga } });
    } catch (e: any) { toast.error(e.message || "Erro"); }
    finally { setLoading(false); }
  };

  const opColor = (name?: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("claro")) return "from-rose-500 to-red-600";
    if (n.includes("tim")) return "from-blue-500 to-indigo-600";
    if (n.includes("vivo")) return "from-violet-500 to-fuchsia-600";
    return "from-primary to-accent";
  };

  if (step === "confirm") {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setStep("form")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={14} /> voltar
        </button>

        <div className="glass-card p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${opColor(selectedOp?.name)} flex items-center justify-center text-white font-display text-lg`}>
              {selectedOp?.name?.[0]}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Revisão final</div>
              <h2 className="font-display text-2xl">Confirme a recarga</h2>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-border/70">
            {[
              ["Telefone", phone],
              ["Operadora", selectedOp?.name],
              ["Receba", `R$ ${selectedPlano?.amount.toFixed(2)}`],
              ["Você paga", `R$ ${selectedPlano?.amount.toFixed(2)}`],
            ].map(([k, v], i) => (
              <div key={k as string} className={`flex items-center justify-between px-5 py-4 ${i % 2 ? "bg-card/40" : "bg-card/20"}`}>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{k}</span>
                <span className="font-mono-x tabular text-base font-semibold">{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2.5">
            <Alert tone="destructive" icon={AlertTriangle} title="Confira a operadora">
              Se o número não for da operadora <strong className="uppercase">{selectedOp?.name}</strong>, a recarga falhará e <strong>não há reembolso</strong>.
            </Alert>
            <Alert tone="warning" icon={AlertTriangle} title="Confira o número">
              Recargas para número errado <strong>não têm reembolso</strong>: <span className="font-mono tabular">{phone}</span>.
            </Alert>
            <Alert tone="muted" icon={Clock} title="Prazo">
              Geralmente <strong>instantâneo</strong>. Pode levar até <strong>24h</strong>; após isso, estorno automático.
            </Alert>
          </div>

          <button onClick={confirm} disabled={loading} className="neon-button mt-6 w-full py-3.5 disabled:opacity-50">
            {loading && <Loader2 className="animate-spin" size={14} />}
            Confirmar e enviar <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
      {/* Left: header + telefone */}
      <section className="glass-card p-7 lg:p-9 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-accent/15 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 stat-chip mb-5">
            <Zap size={12} className="text-primary" /> Recarga PIX instantânea
          </div>
          <h1 className="font-display text-4xl lg:text-5xl leading-tight">
            Recarregue qualquer <span className="gradient-text">celular</span> em segundos.
          </h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-md">
            Digite o número, escolha o valor e pronto. A operadora é detectada automaticamente.
          </p>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">01 · Número do celular</span>
              {detecting && <span className="text-[10px] uppercase tracking-widest text-primary inline-flex items-center gap-1.5"><Loader2 className="animate-spin" size={11} /> detectando</span>}
              {detectedOp && !detecting && <span className="text-[10px] uppercase tracking-widest text-success inline-flex items-center gap-1.5"><Check size={11} /> {detectedOp}</span>}
            </div>
            <div className="relative">
              <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={phone}
                onChange={(e) => onPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                inputMode="numeric"
                className="w-full bg-card/60 border border-border focus:border-primary rounded-2xl pl-12 pr-12 py-5 font-display text-3xl tabular outline-none transition-colors"
              />
              {raw(phone).length >= 10 && (
                <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-success" size={22} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Right: planos */}
      <section className="glass-card p-7">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">02 · Escolha o valor</span>
            <h2 className="font-display text-2xl mt-0.5">
              {selectedOp ? <>Planos · <span className={`bg-gradient-to-r ${opColor(selectedOp.name)} bg-clip-text text-transparent`}>{selectedOp.name}</span></> : "Planos"}
            </h2>
          </div>
          {selectedOp && <span className="stat-chip">{planos.length} opções</span>}
        </div>

        {!selectedOp ? (
          <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
            <div className="mx-auto mb-4 h-10 w-10 rounded-full border border-border/70 bg-card/40 relative">
              <span className="absolute inset-1.5 rounded-full border border-border/60" />
              <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/60" />
            </div>
            <p className="text-sm text-muted-foreground">Digite o número à esquerda para liberar os planos.</p>
          </div>
        ) : loadingPlanos ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2 py-8 justify-center">
            <Loader2 className="animate-spin" size={14} /> Carregando planos…
          </div>
        ) : planos.length === 0 ? (
          <div className="text-sm text-muted-foreground border border-dashed border-border rounded-2xl p-6">
            Nenhum plano disponível para <strong>{selectedOp.name}</strong>.
          </div>
        ) : (
          <>
            <Alert tone="destructive" icon={AlertTriangle} title="Antes de prosseguir">
              Confirme que o número é <strong className="uppercase">{selectedOp.name}</strong>. Sem reembolso em caso de erro.
            </Alert>
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              {planos.map((p) => {
                const active = selectedPlano?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => pickPlano(p)}
                    className={`group relative text-left p-4 rounded-2xl transition-all overflow-hidden ${
                      active
                        ? `bg-gradient-to-br ${opColor(selectedOp.name)} text-white shadow-lg shadow-primary/30`
                        : "bg-card/60 border border-border hover:border-primary/50 hover:-translate-y-0.5"
                    }`}
                  >
                    <div className={`text-[10px] uppercase tracking-widest ${active ? "text-white/70" : "text-muted-foreground"}`}>Receba</div>
                    <div className="font-display text-3xl mt-1 tabular">R$ {p.amount.toFixed(0)}</div>
                    <div className={`mt-2 text-[10px] font-mono uppercase tracking-widest ${active ? "text-white/80" : "text-muted-foreground"}`}>
                      pague R$ {p.amount.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Alert({ tone, icon: Icon, title, children }: { tone: "destructive" | "warning" | "muted"; icon: any; title: string; children: React.ReactNode }) {
  const toneCls = {
    destructive: "border-destructive/40 bg-destructive/10 text-destructive",
    warning: "border-warning/40 bg-warning/10 text-warning",
    muted: "border-border bg-card/40 text-muted-foreground",
  }[tone];
  return (
    <div className={`rounded-xl border ${toneCls} p-3.5 flex items-start gap-2.5`}>
      <Icon size={15} className="mt-0.5 shrink-0" />
      <div className="text-xs leading-relaxed">
        <div className="font-bold uppercase tracking-wide text-[11px] mb-0.5">{title}</div>
        <div className="text-foreground/80">{children}</div>
      </div>
    </div>
  );
}
