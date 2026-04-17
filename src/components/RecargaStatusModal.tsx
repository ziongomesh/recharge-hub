import { useEffect, useRef, useState } from "react";
import { recargasApi, type Recarga } from "@/lib/api";
import { Loader2, CheckCircle2, XCircle, Clock, X } from "lucide-react";

interface Props {
  recargaId: number;
  initial?: Recarga;
  onClose: () => void;
}

const FINAL = new Set(["feita", "cancelada", "expirada"]);

export default function RecargaStatusModal({ recargaId, initial, onClose }: Props) {
  const [recarga, setRecarga] = useState<Recarga | undefined>(initial);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      try {
        const { recarga: r } = await recargasApi.get(recargaId);
        if (!mounted) return;
        setRecarga(r);
        if (FINAL.has(r.status)) return; // stop polling
        timerRef.current = window.setTimeout(tick, 2000);
      } catch (e: any) {
        if (!mounted) return;
        setError(e.message || "Erro ao consultar status");
        timerRef.current = window.setTimeout(tick, 4000);
      }
    };
    tick();
    return () => {
      mounted = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [recargaId]);

  const status = recarga?.status || "pendente";
  const isFinal = FINAL.has(status);
  const isSuccess = status === "feita";
  const isFailed = status === "cancelada" || status === "expirada";

  const meta = isSuccess
    ? { label: "Recarga concluída", desc: "O crédito foi enviado com sucesso para o número.", Icon: CheckCircle2, tone: "text-success" }
    : isFailed
    ? { label: status === "expirada" ? "Recarga expirada" : "Recarga cancelada", desc: "Não foi possível concluir. Seu saldo foi devolvido se aplicável.", Icon: XCircle, tone: "text-destructive" }
    : status === "andamento"
    ? { label: "Em andamento", desc: "A operadora está processando o crédito. Aguarde alguns segundos.", Icon: Loader2, tone: "text-foreground", spin: true }
    : { label: "Pedido enviado", desc: "Aguardando confirmação da operadora…", Icon: Clock, tone: "text-foreground", spin: true };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-md bg-background border border-foreground p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground" aria-label="Fechar">
          <X size={18} />
        </button>

        <div className="label-eyebrow">Acompanhamento</div>
        <h3 className="font-display text-3xl mt-2 mb-6">Sua recarga.</h3>

        <div className="flex items-start gap-4 border-y border-border py-6">
          <meta.Icon className={`${meta.tone} ${meta.spin ? "animate-spin" : ""} shrink-0`} size={32} />
          <div>
            <div className="font-display text-xl">{meta.label}</div>
            <div className="text-sm text-muted-foreground mt-1">{meta.desc}</div>
          </div>
        </div>

        {recarga && (
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="label-eyebrow">Número</dt>
              <dd className="font-mono tabular">{recarga.phone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="label-eyebrow">Operadora</dt>
              <dd className="font-mono tabular">{recarga.operadora_name || `#${recarga.operadora_id}`}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="label-eyebrow">Valor</dt>
              <dd className="font-mono tabular">R$ {Number(recarga.amount).toFixed(2)}</dd>
            </div>
          </dl>
        )}

        {error && <div className="mt-4 text-xs text-destructive">{error}</div>}

        <button
          onClick={onClose}
          className={`mt-8 w-full px-6 py-3 text-sm transition-colors ${
            isFinal ? "bg-foreground text-background" : "border border-foreground hover:bg-paper-2"
          }`}
        >
          {isFinal ? "Fechar" : "Continuar em segundo plano"}
        </button>
      </div>
    </div>
  );
}
