import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { recargasApi, planosApi, operadorasApi, type Operadora, type Plano } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, Check, Loader2, AlertTriangle, Clock } from "lucide-react";

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
      console.log("[RecargasPage] planos recebidos para operadora", id, planos);
      setPlanos(planos);
      if (!planos.length) toast.error("Nenhum plano cadastrado para essa operadora. Sincronize o catálogo no admin.");
    }
    catch (e: any) {
      console.error("[RecargasPage] erro ao carregar planos", e);
      toast.error(e?.message || "Erro ao carregar planos");
      setPlanos([]);
    }
    finally { setLoadingPlanos(false); }
  };

  const detect = useCallback(async (digits: string, seq: number) => {
    if (digits.length < 10) return;
    setDetectedOp(null);
    setSelectedOp(null);
    setPlanos([]);
    setSelectedPlano(null);
    try {
      const r = await recargasApi.detectOperator(digits);
      if (seq !== detectSeqRef.current) return;
      console.log("[RecargasPage] detect response", r);
      if (r.operator) {
        const name = r.operator.charAt(0).toUpperCase() + r.operator.slice(1).toLowerCase();
        setDetectedOp(name);
        const op = operadoras.find((o) => o.name.toLowerCase() === r.operator.toLowerCase());
        if (op) { setSelectedOp(op); loadPlanos(op.id); }
        else { toast.error(`Operadora ${name} não habilitada`); }
      } else {
        toast.error(r.message || "Operadora não identificada para esse número");
      }
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
      setDetecting(false);
      setDetectedOp(null);
      setSelectedOp(null);
      setPlanos([]);
      setSelectedPlano(null);
      return;
    }

    setDetecting(true);
    const timer = window.setTimeout(() => {
      void detect(d, seq);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [phone, detect]);

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
      const { recarga } = await recargasApi.create({
        operadora_id: selectedOp.id,
        phone: raw(phone),
        plano_id: selectedPlano.id,
      });
      toast.success("Recarga solicitada!");
      navigate("/historico", { state: { newRecargaId: recarga.id, newRecarga: recarga } });
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setLoading(false);
    }
  };

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

        {/* Avisos importantes */}
        <div className="mt-6 space-y-3">
          <div className="border-l-2 border-destructive bg-destructive/5 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-destructive mt-0.5 shrink-0" />
              <div className="text-sm">
                <div className="font-semibold text-destructive uppercase tracking-wide text-xs mb-1">
                  Confira a operadora!
                </div>
                <p className="text-foreground/80 leading-relaxed">
                  Se o número não for da operadora <strong className="uppercase">{selectedOp?.name}</strong>, a recarga
                  falhará e <strong>não poderemos reembolsar o valor</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="border-l-2 border-warning bg-warning/5 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
              <div className="text-sm">
                <div className="font-semibold uppercase tracking-wide text-xs mb-1">Confira o número</div>
                <p className="text-foreground/80 leading-relaxed">
                  Confira o número digitado: <strong className="font-mono tabular">{phone}</strong>. Recargas
                  enviadas para número errado <strong>não têm reembolso</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="border-l-2 border-border bg-paper-2 p-4">
            <div className="flex items-start gap-2">
              <Clock size={16} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-sm text-foreground/80 leading-relaxed">
                A recarga é geralmente <strong>instantânea</strong>, mas pode levar até <strong>24h</strong> para cair.
                Se não cair nesse prazo, o valor é estornado automaticamente para seu saldo.
              </div>
            </div>
          </div>
        </div>

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
      {selectedOp && (
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <div className="label-eyebrow">Passo 02 · Valor</div>
            <div className="label-eyebrow">{planos.length} opções</div>
          </div>

          {/* Aviso de operadora */}
          <div className="border-l-2 border-destructive bg-destructive/5 p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-destructive mt-0.5 shrink-0" />
              <div className="text-sm">
                <div className="font-semibold text-destructive uppercase tracking-wide text-xs mb-1">
                  Confira a operadora antes de prosseguir
                </div>
                <p className="text-foreground/80 leading-relaxed">
                  Você selecionou <strong className="uppercase">{selectedOp.name}</strong>. Se o número{" "}
                  <span className="font-mono tabular">{phone}</span> não pertencer a essa operadora, a recarga
                  falhará e <strong>não há reembolso</strong>.
                </p>
              </div>
            </div>
          </div>

          {loadingPlanos ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="animate-spin" size={14} /> Carregando planos…
            </div>
          ) : planos.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed border-border p-6">
              Nenhum plano disponível para <strong>{selectedOp.name}</strong>. Peça ao admin para sincronizar o catálogo da Poeki em Admin → Operadoras & Planos.
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
