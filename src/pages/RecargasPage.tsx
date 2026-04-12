import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { recargasApi, planosApi, operadorasApi, type Operadora, type Plano } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

type Step = "operadora" | "phone" | "plano" | "confirm" | "done";

export default function RecargasPage() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>("operadora");
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);
  const [selectedOp, setSelectedOp] = useState<Operadora | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<string | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [selectedPlano, setSelectedPlano] = useState<Plano | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    operadorasApi.list().then((r) => {
      const ops = r.operadoras.filter((o) => o.enabled);
      setOperadoras(ops);
      const preselect = searchParams.get("operadora");
      if (preselect) {
        const op = ops.find((o) => o.id === Number(preselect));
        if (op) { setSelectedOp(op); setStep("phone"); }
      }
    }).catch(() => {
      setOperadoras([
        { id: 1, name: "Claro", enabled: true },
        { id: 2, name: "TIM", enabled: true },
        { id: 3, name: "Vivo", enabled: true },
      ]);
    });
  }, [searchParams]);

  const selectOperadora = (op: Operadora) => {
    setSelectedOp(op);
    setStep("phone");
  };

  const handleCheckPhone = async () => {
    if (!phone || phone.length < 10) { toast.error("Número inválido"); return; }
    setLoading(true);
    try {
      const result = await recargasApi.checkPhone(phone, selectedOp?.name.toLowerCase());
      if (result.isBlacklisted) {
        setPhoneStatus("Número na blacklist");
        toast.error("Número está na blacklist");
      } else if (result.isCooldown) {
        setPhoneStatus("Cooldown ativo");
        toast.error(result.message);
      } else {
        setPhoneStatus("OK");
        const plans = await planosApi.listByOperadora(selectedOp!.id);
        setPlanos(plans.planos);
        setStep("plano");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao verificar número");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedOp || !selectedPlano) return;
    setLoading(true);
    try {
      await recargasApi.create({ operadora_id: selectedOp.id, phone, plano_id: selectedPlano.id });
      setStep("done");
      toast.success("Recarga solicitada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao solicitar recarga");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("operadora");
    setSelectedOp(null);
    setPhone("");
    setPhoneStatus(null);
    setPlanos([]);
    setSelectedPlano(null);
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        {step !== "operadora" && step !== "done" && (
          <button onClick={() => setStep(step === "plano" ? "phone" : step === "confirm" ? "plano" : "operadora")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-lg font-semibold text-foreground">Nova Recarga</h1>
      </div>

      {step === "operadora" && (
        <div className="space-y-3">
          <span className="section-label">Escolha a operadora</span>
          <div className="flex gap-4 mt-2">
            {operadoras.map((op) => (
              <div key={op.id} className="operator-card min-w-[120px]" onClick={() => selectOperadora(op)}>
                <span className="font-semibold text-foreground">{op.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === "phone" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{selectedOp?.name} — Número</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Número do celular (DDD + número)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="11999999999" maxLength={11} />
            </div>
            {phoneStatus && phoneStatus !== "OK" && (
              <p className="text-sm text-destructive">{phoneStatus}</p>
            )}
            <Button onClick={handleCheckPhone} disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Verificar e continuar
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "plano" && (
        <div className="space-y-3">
          <span className="section-label">Escolha o plano — {selectedOp?.name}</span>
          <div className="grid gap-3 mt-2">
            {planos.map((p) => (
              <div
                key={p.id}
                className={`operator-card flex-row justify-between items-center ${selectedPlano?.id === p.id ? "border-primary ring-1 ring-primary" : ""}`}
                onClick={() => setSelectedPlano(p)}
              >
                <span className="font-semibold text-foreground">R$ {p.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
          {selectedPlano && (
            <Button onClick={() => setStep("confirm")} className="w-full mt-4">
              Continuar
            </Button>
          )}
        </div>
      )}

      {step === "confirm" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirmar recarga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Operadora</span><span className="font-medium">{selectedOp?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Número</span><span className="font-medium">{phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Valor</span><span className="font-medium">R$ {selectedPlano?.amount.toFixed(2)}</span></div>
            </div>
            <Button onClick={handleConfirm} disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Confirmar recarga
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "done" && (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <CheckCircle className="mx-auto text-success" size={48} />
            <h2 className="text-lg font-semibold">Recarga solicitada!</h2>
            <p className="text-sm text-muted-foreground">Acompanhe o status no Histórico.</p>
            <Button onClick={reset} variant="outline">Nova recarga</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
