import { X, Download, Copy, QrCode, Smartphone, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { EsimVenda } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  venda: EsimVenda | null;
  qr: string | null;
}

export default function EsimQrModal({ open, onClose, venda, qr }: Props) {
  if (!open || !venda) return null;

  const copyObservation = async () => {
    if (!venda.observacao) return;
    await navigator.clipboard.writeText(venda.observacao);
    toast.success("Dados do eSIM copiados");
  };

  const download = () => {
    if (!qr) return;
    const a = document.createElement("a");
    a.href = qr;
    a.download = `esim_${venda.id}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/25 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-primary/20 bg-paper shadow-2xl shadow-primary/20">
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-primary/10 p-2 text-primary transition hover:bg-primary hover:text-primary-foreground" aria-label="Fechar entrega do eSIM">
          <X size={18} />
        </button>

        <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
          <div className="border-b border-primary/15 bg-card p-6 md:border-b-0 md:border-r md:p-8">
            <div className="label-eyebrow">Entrega imediata</div>
            <h2 className="font-display mt-2 text-3xl leading-tight">Seu eSIM está pronto</h2>
            <div className="mt-2 text-sm text-muted-foreground">
              {venda.produto_name} · {venda.operadora} · R$ {venda.amount.toFixed(2)}
            </div>

            <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-foreground">
              <div className="flex items-center gap-2 font-semibold text-success">
                <CheckCircle2 size={16} /> Compra confirmada
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Escaneie o QR Code no aparelho onde o eSIM será usado. Salve esta tela antes de fechar.
              </p>
            </div>

            {qr ? (
              <div className="mt-6 rounded-2xl border border-primary/20 bg-background p-4">
                <img src={qr} alt="QR Code do eSIM" className="mx-auto h-auto max-w-full rounded-xl" />
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-primary/20 p-8 text-center text-sm text-muted-foreground">
                QR Code indisponível
              </div>
            )}

            {qr && (
              <button
                onClick={download}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
              >
                <Download size={14} /> Baixar QR Code
              </button>
            )}
          </div>

          <div className="p-6 md:p-8">
            <div className="label-eyebrow">Como instalar</div>
            <div className="mt-4 grid gap-3">
              {[
                [QrCode, "Abra Ajustes > Celular", "Escolha adicionar eSIM ou plano celular no seu aparelho."],
                [Smartphone, "Escaneie o QR Code", "Use a câmera do próprio aparelho. Não reutilize em outro dispositivo."],
                [ShieldAlert, "Ative com atenção", "Depois de ativado, o eSIM fica vinculado ao aparelho."],
              ].map(([Icon, title, text]) => (
                <div key={String(title)} className="flex gap-3 rounded-2xl border border-primary/15 bg-card p-4">
                  <Icon className="mt-0.5 shrink-0 text-primary" size={18} />
                  <div>
                    <div className="text-sm font-semibold">{String(title)}</div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{String(text)}</p>
                  </div>
                </div>
              ))}
            </div>

            {venda.observacao && (
              <div className="mt-6 border-t border-border pt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="label-eyebrow">Dados da entrega</div>
                  <button onClick={copyObservation} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                    <Copy size={13} /> Copiar
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-primary/15 bg-card p-3 text-sm text-foreground">
                  {venda.observacao}
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
              ⚠️ Salve o QR Code agora. Por segurança, ele não fica disponível para reabrir depois.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
