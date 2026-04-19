import { X, Download } from "lucide-react";
import type { EsimVenda } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  venda: EsimVenda | null;
  qr: string | null;
}

export default function EsimQrModal({ open, onClose, venda, qr }: Props) {
  if (!open || !venda) return null;

  const download = () => {
    if (!qr) return;
    const a = document.createElement("a");
    a.href = qr;
    a.download = `esim_${venda.id}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-paper border border-border max-w-md w-full p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>

        <div className="label-eyebrow">Seu eSIM</div>
        <h2 className="font-display text-3xl mt-2 mb-1">{venda.produto_name}</h2>
        <div className="text-sm text-muted-foreground mb-6">
          {venda.operadora} · R$ {venda.amount.toFixed(2)}
        </div>

        {qr ? (
          <div className="border border-border bg-white p-4 flex items-center justify-center">
            <img src={qr} alt="QR Code do eSIM" className="max-w-full h-auto" />
          </div>
        ) : (
          <div className="border border-border p-8 text-center text-sm text-muted-foreground">
            QR Code indisponível
          </div>
        )}

        {qr && (
          <button
            onClick={download}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-foreground text-background py-3 text-sm hover:opacity-90"
          >
            <Download size={14} /> Baixar QR Code
          </button>
        )}

        {venda.observacao && (
          <div className="mt-6 border-t border-border pt-4">
            <div className="label-eyebrow mb-2">Observação</div>
            <div className="text-sm whitespace-pre-wrap text-foreground">{venda.observacao}</div>
          </div>
        )}

        <div className="mt-6 text-xs text-muted-foreground border-t border-border pt-4">
          ⚠️ Salve o QR code agora. Por segurança, ele não fica disponível para reabrir depois.
        </div>
      </div>
    </div>
  );
}
