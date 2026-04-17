import { useEffect, useState } from "react";
import { recargasApi, type Recarga } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function HistoricoPage() {
  const [recargas, setRecargas] = useState<Recarga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recargasApi.list().then((r) => setRecargas(r.recargas)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const label = (s: string) => ({ pendente: "Pendente", andamento: "Em curso", feita: "Feita", cancelada: "Cancelada", expirada: "Expirada" } as Record<string, string>)[s] || s;

  return (
    <div className="max-w-5xl">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <div className="label-eyebrow">Arquivo</div>
          <h2 className="font-display text-5xl mt-1">Suas recargas.</h2>
        </div>
        <div className="label-eyebrow tabular">Total: {String(recargas.length).padStart(3, "0")}</div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={14} /> Carregando…</div>
      ) : recargas.length === 0 ? (
        <div className="border border-dashed border-border p-10 text-center text-muted-foreground text-sm">Nenhuma recarga ainda.</div>
      ) : (
        <div className="border-t-2 border-foreground">
          <div className="grid grid-cols-12 gap-4 py-3 label-eyebrow border-b border-border">
            <div className="col-span-1">№</div>
            <div className="col-span-2">Data</div>
            <div className="col-span-2">Operadora</div>
            <div className="col-span-3">Número</div>
            <div className="col-span-2">Valor</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          {recargas.map((r, i) => (
            <div key={r.id} className="grid grid-cols-12 gap-4 py-4 border-b border-border items-center text-sm hover:bg-paper-2/60 transition-colors">
              <div className="col-span-1 font-mono tabular text-muted-foreground">{String(i + 1).padStart(3, "0")}</div>
              <div className="col-span-2 font-mono tabular">{new Date(r.created_at).toLocaleDateString("pt-BR")}</div>
              <div className="col-span-2 font-display text-lg">{r.operadora_name || `#${r.operadora_id}`}</div>
              <div className="col-span-3 font-mono tabular">{r.phone}</div>
              <div className="col-span-2 font-mono tabular">R$ {r.amount.toFixed(2)}</div>
              <div className="col-span-2 text-right">
                <span className={`pill status-${r.status}`}>{label(r.status)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
