import { useState, useEffect, useCallback } from "react";
import { recargasApi, planosApi, operadorasApi, type Operadora, type Plano } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, Check, Loader2 } from "lucide-react";

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
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");

  useEffect(() => {
    operadorasApi.list().then((r) => setOperadoras(r.operadoras.filter((o) => o.enabled)))
      .catch(() => setOperadoras([
        { id: 1, name: "Claro", enabled: true },
        { id: 2, name: "TIM",   enabled: true },
        { id: 3, name: "Vivo",  enabled: true },
      ]));
  }, []);

  const loadPlanos = async (id: number) => {
    setLoadingPlanos(true);
    try { const { planos } = await planosApi.listByOperadora(id); setPlanos(planos); }
    catch { setPlanos([]); }
    finally { setLoadingPlanos(false); }
  };

  const detect = useCallback(async (digits: string) => {
    if (digits.length < 10) return;
    setDetecting(true);
    try {
      const r = await recargasApi.detectOperator(digits);
      if (r.operator) {
        const name = r.operator.charAt(0).toUpperCase() + r.operator.slice(1).toLowerCase();
        setDetectedOp(name);
        const op = operadoras.find((o) => o.name.toLowerCase() === r.operator.toLowerCase());
        if (op) { setSelectedOp(op); loadPlanos(op.id); }
      }
    } catch {} finally { setDetecting(false); }
  }, [operadoras]);

  const onPhone = (v: string) => {
    const f = fmtPhone(v); setPhone(f);
    const d = raw(f);
    if (d.length >= 10) detect(d);
    else { setDetectedOp(null); setSelectedOp(null); setPlanos([]); setSelectedPlano(null); }
  };

  const pickPlano = async (p: Plano) => {
    const d = raw(phone);
    if (d.length < 10) return;
    setSelectedPlano(p);
    setLoading(true);
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
      await recargasApi.create({ operadora_id: selectedOp.id, phone: raw(phone), plano_id: selectedPlano.id });
      setStep("done"); toast.success("Recarga solicitada!");
    } catch (e: any) { toast.error(e.message || "Erro"); }
    finally { setLoading(false); }
  };

  const reset = () => {
    setPhone(""); setDetectedOp(null); setSelectedOp(null);
    setPlanos([]); setSelectedPlano(null); setStep("form");
  };

  if (step === "done") {
    return (
      <div className="max-w-xl border border-foreground p-10">
        <div className="label-eyebrow">Confirmação</div>
        <h2 className="font-display text-5xl mt-2">Pedido <em className="italic">enviado</em>.</h2>
        <p className="text-ink-soft mt-4 text-sm">Acompanhe o andamento na seção <strong>Histórico</strong>. A confirmação chega em segundos.</p>
        <button onClick={reset} className="mt-8 inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm">
          Nova recarga <ArrowUpRight size={14} />
        </button>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="max-w-xl">
        <button onClick={() => setStep("form")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={14} /> voltar
        </button>
        <div className="label-eyebrow">Revisão · 03/03</div>
        <h2 className="font-display text-5xl mt-2 mb-8">Confirmar recarga.</h2>

        <dl className="border-y border-foreground divide-y divide-border">
          {[
            ["Telefone", phone],
            ["Operadora", selectedOp?.name],
            ["Receba", `R$ ${selectedPlano?.amount.toFixed(2)}`],
            ["Pague", `R$ ${selectedPlano?.amount.toFixed(2)}`],
          ].map(([k, v]) => (
            <div key={k as string} className="flex items-baseline justify-between py-4">
              <dt className="label-eyebrow">{k}</dt>
              <dd className="font-mono tabular text-base text-foreground">{v}</dd>
            </div>
          ))}
        </dl>

        <button onClick={confirm} disabled={loading}
          className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-4 text-sm disabled:opacity-50">
          {loading && <Loader2 className="animate-spin" size={14} />}
          Confirmar e enviar <ArrowUpRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Step 1 */}
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-4">
          <div className="label-eyebrow">Passo 01 · Número</div>
          {detecting && <span className="label-eyebrow flex items-center gap-1.5"><Loader2 className="animate-spin" size={11} /> detectando</span>}
          {detectedOp && !detecting && <span className="label-eyebrow text-foreground">↳ {detectedOp}</span>}
        </div>
        <div className="relative">
          <input
            value={phone}
            onChange={(e) => onPhone(e.target.value)}
            placeholder="(00) 00000-0000"
            className="w-full bg-transparent border-b-2 border-foreground/30 focus:border-foreground transition-colors py-4 font-display text-4xl md:text-5xl tracking-tight tabular outline-none"
          />
          {raw(phone).length >= 10 && (
            <Check className="absolute right-2 top-1/2 -translate-y-1/2 text-success" size={24} />
          )}
        </div>
      </section>

      {/* Step 2 */}
      {selectedOp && (loadingPlanos || planos.length > 0) && (
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <div className="label-eyebrow">Passo 02 · Valor</div>
            <div className="label-eyebrow">{planos.length} opções</div>
          </div>

          {loadingPlanos ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="animate-spin" size={14} /> Carregando planos…
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-border">
              {planos.map((p) => {
                const active = selectedPlano?.id === p.id;
                return (
                  <button key={p.id} onClick={() => pickPlano(p)}
                    className={`text-left p-5 border-r border-b border-border transition-colors ${
                      active ? "bg-foreground text-background" : "bg-card hover:bg-paper-2"
                    }`}>
                    <div className={`label-eyebrow ${active ? "text-background/60" : ""}`}>Receba</div>
                    <div className="font-display text-4xl mt-1 tabular">R$ {p.amount.toFixed(0)}</div>
                    <div className={`mt-3 text-[11px] font-mono uppercase tracking-widest ${active ? "text-background/70" : "text-muted-foreground"}`}>
                      pague R$ {p.amount.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
