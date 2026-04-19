import { useEffect, useState } from "react";
import { adminApi, pagamentosApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AdminBalanceHero from "@/components/AdminBalanceHero";

const fmtBRL = (n: number) => `R$ ${Number(n || 0).toFixed(2)}`;

export default function AdminDepositosPage() {
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", search: "", from: "", to: "" });

  const load = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) qs.set(k, v); });
    qs.set("limit", "100");
    try {
      const r = await adminApi.pagamentos(qs.toString());
      setPagamentos(r.pagamentos);
      setTotal(r.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters]);

  const totalPaid = pagamentos.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <AdminBalanceHero
        label="VizzionPay"
        fetcher={async () => {
          const r = await pagamentosApi.adminBalance();
          return {
            balance: r.balance,
            extra: r.blocked != null ? `bloqueado R$ ${Number(r.blocked).toFixed(2)}` : null,
          };
        }}
      />
      <div>
        <div className="label-eyebrow">Financeiro</div>
        <h1 className="font-display text-4xl mt-1">Depósitos.</h1>
        <p className="text-sm text-muted-foreground mt-1">{total} no total · {fmtBRL(totalPaid)} aprovado nesta página</p>
      </div>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Filtros</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input placeholder="Buscar (user / txid)" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
          <select className="h-9 border border-border rounded px-2 text-sm bg-background" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Status (todos)</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="failed">Falhou</option>
          </select>
          <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
          <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? <p className="text-sm text-muted-foreground p-4">Carregando…</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagamentos.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhum depósito encontrado</TableCell></TableRow>}
                {pagamentos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs font-mono-x">{new Date(p.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{p.username}</TableCell>
                    <TableCell className="font-mono tabular">{fmtBRL(Number(p.amount))}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "paid" ? "default" : p.status === "failed" ? "destructive" : "secondary"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono-x text-muted-foreground truncate max-w-[200px]">{p.transaction_id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
