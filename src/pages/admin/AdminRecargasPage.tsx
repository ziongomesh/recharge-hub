import { useEffect, useState } from "react";
import { recargasApi, type Recarga } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminRecargasPage() {
  const [recargas, setRecargas] = useState<Recarga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recargasApi.listAll().then((r) => setRecargas(r.recargas)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { pendente: "Pendente", andamento: "Em andamento", feita: "Feita", cancelada: "Cancelada", expirada: "Expirada" };
    return map[s] || s;
  };

  return (
    <div>
      <h1 className="text-lg font-semibold mb-6">Todas as Recargas</h1>
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
                <TableHead>Poeki ID</TableHead>
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
