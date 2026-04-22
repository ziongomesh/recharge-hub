import { useEffect, useState } from "react";
import { recargasApi, planosApi, type Recarga } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import AdminBalanceHero from "@/components/AdminBalanceHero";

export default function AdminRecargasPage() {
  const [recargas, setRecargas] = useState<Recarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = () => {
    setLoading(true);
    recargasApi.listAll().then((r) => setRecargas(r.recargas)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const r = await recargasApi.syncAll("all");
      toast.success(`Sincronizado: ${r.total} pedidos verificados na API, ${r.changed} atualizados${r.errors ? `, ${r.errors} erros` : ""}`);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Falha ao sincronizar com a API");
    } finally {
      setSyncing(false);
    }
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { pendente: "Pendente", andamento: "Em andamento", feita: "Feita", cancelada: "Cancelada", expirada: "Expirada", reembolsado: "Reembolsado" };
    return map[s] || s;
  };

  return (
    <div>
      <div className="mb-6">
        <AdminBalanceHero
          label="Poeki"
          fetcher={async () => {
            const r: any = await planosApi.poekiBalance();
            const bal = r?.data?.balance ?? r?.balance ?? r?.data?.amount ?? null;
            return { balance: typeof bal === "number" ? bal : Number(bal) };
          }}
        />
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Todas as Recargas</h1>
        <button
          onClick={handleSyncAll}
          disabled={syncing || loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest font-mono border border-foreground hover:bg-paper-2 disabled:opacity-50"
        >
          <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Sincronizando…" : "Sincronizar todas com API"}
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Operadora</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pedido ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recargas.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-mono">#{r.id}</TableCell>
                  <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-sm">#{r.user_id}</TableCell>
                  <TableCell className="text-sm">{r.operadora_name || `#${r.operadora_id}`}</TableCell>
                  <TableCell className="text-sm font-mono">{r.phone}</TableCell>
                  <TableCell className="text-sm">R$ {r.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-sm">R$ {r.cost.toFixed(2)}</TableCell>
                  <TableCell><span className={`status-badge status-${r.status}`}>{statusLabel(r.status)}</span></TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{r.poeki_id || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
