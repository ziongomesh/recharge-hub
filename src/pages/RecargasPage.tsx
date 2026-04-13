import { useState, useEffect, useCallback } from "react";
import { recargasApi, planosApi, operadorasApi, type Operadora, type Plano } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Loader2, Check, Phone } from "lucide-react";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function rawPhone(value: string): string {
  return value.replace(/\D/g, "");
}

export default function RecargasPage() {
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);
  const [phone, setPhone] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectedOp, setDetectedOp] = useState<string | null>(null);
  const [selectedOp, setSelectedOp] = useState<Operadora | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loadingPlanos, setLoadingPlanos] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<Plano | null>(null);
  const [phoneStatus, setPhoneStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");

  useEffect(() => {
    operadorasApi.list().then((r) => {
      setOperadoras(r.operadoras.filter((o) => o.enabled));
    }).catch(() => {
      setOperadoras([
        { id: 1, name: "Claro", enabled: true },
        { id: 2, name: "TIM", enabled: true },
        { id: 3, name: "Vivo", enabled: true },
      ]);
    });
  }, []);

  const detectOperator = useCallback(async (digits: string) => {
    if (digits.length < 10) return;
    setDetecting(true);
    try {
      const result = await recargasApi.detectOperator(digits);
      if (result.operator) {
        const opName = result.operator.charAt(0).toUpperCase() + result.operator.slice(1).toLowerCase();
        setDetectedOp(opName);
        const op = operadoras.find(
          (o) => o.name.toLowerCase() === result.operator.toLowerCase()
        );
        if (op) {
          setSelectedOp(op);
          loadPlanos(op.id);
        }
      }
    } catch {
      // Detection failed silently, user can pick manually
    } finally {
      setDetecting(false);
    }
  }, [operadoras]);

  const loadPlanos = async (opId: number) => {
    setLoadingPlanos(true);
    try {
      const { planos } = await planosApi.listByOperadora(opId);
      setPlanos(planos);
    } catch {
      setPlanos([]);
    } finally {
      setLoadingPlanos(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setPhone(formatted);
    const digits = rawPhone(formatted);
    const valid = digits.length >= 10;
    setPhoneValid(valid);

    if (valid && digits.length >= 10) {
      detectOperator(digits);
    } else {
      setDetectedOp(null);
      setSelectedOp(null);
      setPlanos([]);
      setSelectedPlano(null);
    }
  };

  const selectOperadora = (op: Operadora) => {
    setSelectedOp(op);
    setSelectedPlano(null);
    loadPlanos(op.id);
  };

  const handleSelectPlano = async (plano: Plano) => {
    const digits = rawPhone(phone);
    if (digits.length < 10) return;

    setSelectedPlano(plano);
    setLoading(true);
    try {
      const result = await recargasApi.checkPhone(digits, selectedOp?.name.toLowerCase());
      if (result.isBlacklisted) {
        setPhoneStatus("Número na blacklist");
        toast.error("Número está na blacklist");
        setSelectedPlano(null);
      } else if (result.isCooldown) {
        setPhoneStatus("Cooldown ativo");
        toast.error(result.message);
        setSelectedPlano(null);
      } else {
        setPhoneStatus(null);
        setStep("confirm");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao verificar número");
      setSelectedPlano(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedOp || !selectedPlano) return;
    setLoading(true);
    try {
      await recargasApi.create({ operadora_id: selectedOp.id, phone: rawPhone(phone), plano_id: selectedPlano.id });
      setStep("done");
      toast.success("Recarga solicitada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao solicitar recarga");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhone("");
    setPhoneValid(false);
    setDetectedOp(null);
    setSelectedOp(null);
    setPlanos([]);
    setSelectedPlano(null);
    setPhoneStatus(null);
    setStep("form");
  };

  if (step === "done") {
    return (
      <div className="max-w-lg">
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <CheckCircle className="mx-auto" size={48} style={{ color: "hsl(var(--success))" }} />
            <h2 className="text-lg font-semibold text-foreground">Recarga solicitada!</h2>
            <p className="text-sm text-muted-foreground">Acompanhe o status no Histórico.</p>
            <Button onClick={reset} variant="outline">Nova recarga</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep("form")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Confirmar Recarga</h1>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">Telefone</span>
                <span className="font-medium font-mono text-foreground">{phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">Operadora</span>
                <span className="font-medium text-foreground">{selectedOp?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">Receba</span>
                <span className="font-bold text-foreground">R$ {selectedPlano?.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Pague</span>
                <span className="font-bold" style={{ color: "hsl(var(--success))" }}>R$ {selectedPlano?.cost.toFixed(2)}</span>
              </div>
            </div>
            <Button onClick={handleConfirm} disabled={loading} className="w-full" size="lg">
              {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Confirmar recarga
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-lg font-semibold text-foreground">Recarga de Celular</h1>
      </div>

      <div className="space-y-4">
        {/* Step 1: Phone + detected operator */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: "hsl(var(--primary) / 0.2)", color: "hsl(var(--primary))" }}>1</span>
              <span className="font-semibold text-foreground">Informe o Número</span>
              {detectedOp && !detecting && (
                <span className="ml-auto text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>
                  {detectedOp.toUpperCase()}
                </span>
              )}
              {detecting && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="animate-spin" size={12} />
                  Detectando...
                </span>
              )}
            </div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
              Telefone com DDD
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(00) 00000-0000"
                className="pl-10 pr-10 h-12 text-lg font-mono"
              />
              {phoneValid && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "hsl(var(--success))" }} />
              )}
            </div>
            {phoneStatus && (
              <p className="text-sm text-destructive mt-2">{phoneStatus}</p>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Planos */}
        {selectedOp && planos.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: "hsl(var(--primary) / 0.2)", color: "hsl(var(--primary))" }}>3</span>
                <span className="font-semibold text-foreground">Escolha o Valor</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {planos.map((p) => (
                  <div
                    key={p.id}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary ${
                      selectedPlano?.id === p.id ? "border-primary" : "border-border/50"
                    }`}
                    onClick={() => handleSelectPlano(p)}
                  >
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Receba</span>
                    <span className="text-xl font-bold text-foreground">R$ {p.amount.toFixed(0)}</span>
                    <span
                      className="mt-2 px-3 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: "hsl(var(--success))", color: "hsl(var(--success-foreground))" }}
                    >
                      Pague R$ {p.cost.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Loader2 className="animate-spin" size={14} />
                  Verificando número...
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {selectedOp && loadingPlanos && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={14} />
            Carregando planos...
          </div>
        )}
      </div>
    </div>
  );
}
