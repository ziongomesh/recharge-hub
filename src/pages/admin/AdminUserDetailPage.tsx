import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

const fmtBRL = (n: number) => `R$ ${Number(n || 0).toFixed(2)}`;
const fmt = (d: string) => new Date(d).toLocaleString("pt-BR");

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.users.full>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", phone: "", role: "user", balance: "0" });

  useEffect(() => {
    if (!id) return;
    adminApi.users.full(Number(id)).then((r) => {
      setData(r);
      setForm({
        username: r.user.username,
        email: r.user.email,
        phone: r.user.phone || "",
        role: r.user.role,
        balance: Number(r.user.balance || 0).toFixed(2),
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    if (!id) return;
    const balanceNum = parseFloat(form.balance.replace(",", "."));
    if (isNaN(balanceNum) || balanceNum < 0) { toast.error("Saldo inválido"); return; }
    setSaving(true);
    try {
      const updated = await adminApi.users.update(Number(id), {
        username: form.username,
        email: form.email,
        phone: form.phone,
        role: form.role as "user" | "mod" | "admin",
        balance: balanceNum,
      });
      setData((d) => d ? { ...d, user: updated } : d);
      toast.success("Usuário atualizado");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!data) return <p className="text-sm text-destructive">Usuário não encontrado.</p>;

  const { user, stats, recargas, pagamentos, logs } = data;

  return (
    <div className="space-y-6">
      <Link to="/admin/usuarios" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft size={12} /> Voltar
      </Link>

      <div>
        <div className="label-eyebrow">Usuário · {user.role}</div>
        <h1 className="font-display text-4xl mt-1">{user.username}</h1>
        <div className="text-sm text-muted-foreground mt-1 font-mono-x">
          CPF {user.cpf} · cadastro em {fmt(user.created_at)}
        </div>
      </div>

      {/* Editar dados */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Editar informações</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome</Label>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Telefone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Saldo (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              className="font-mono tabular"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cargo</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="mod">Moderador</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 flex items-end">
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              <span className="ml-2">Salvar alterações</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Saldo atual" value={fmtBRL(user.balance)} highlight />
        <Stat label="Total recargas" value={Number(stats.total_recargas)} />
        <Stat label="Recarregado (sucesso)" value={fmtBRL(Number(stats.total_recarregado))} />
        <Stat label="Total gasto" value={fmtBRL(Number(stats.total_gasto))} />
        <Stat label="Depositado" value={`${fmtBRL(Number(stats.total_depositado))} (${stats.total_depositos}×)`} />
      </div>

      {/* Recargas */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Recargas ({recargas.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Operadora</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recargas.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Nenhuma recarga</TableCell></TableRow>}
              {recargas.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-mono-x">{fmt(r.created_at)}</TableCell>
                  <TableCell>{r.operadora_name}</TableCell>
                  <TableCell className="font-mono-x">{r.phone}</TableCell>
                  <TableCell className="font-mono tabular">{fmtBRL(Number(r.amount))}</TableCell>
                  <TableCell className="font-mono tabular text-muted-foreground">{fmtBRL(Number(r.cost))}</TableCell>
                  <TableCell><Badge variant={r.status === "feita" ? "default" : r.status === "cancelada" || r.status === "expirada" ? "destructive" : "secondary"}>{r.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Depósitos */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Depósitos ({pagamentos.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transaction ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamentos.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Nenhum depósito</TableCell></TableRow>}
              {pagamentos.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs font-mono-x">{fmt(p.created_at)}</TableCell>
                  <TableCell className="font-mono tabular">{fmtBRL(Number(p.amount))}</TableCell>
                  <TableCell><Badge variant={p.status === "paid" ? "default" : p.status === "failed" ? "destructive" : "secondary"}>{p.status}</Badge></TableCell>
                  <TableCell className="text-xs font-mono-x text-muted-foreground truncate max-w-[200px]">{p.transaction_id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Atividade ({logs.length})</CardTitle></CardHeader>
        <CardContent>
          <ul className="divide-y divide-border text-sm">
            {logs.length === 0 && <li className="text-muted-foreground py-3">Sem atividade registrada</li>}
            {logs.map((l: any) => (
              <li key={l.id} className="py-2 flex items-baseline justify-between gap-3">
                <div>
                  <span className="font-mono-x text-xs text-muted-foreground mr-2">{l.action}</span>
                  <span>{l.details}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono-x whitespace-nowrap">{fmt(l.created_at)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`font-display text-xl mt-1 tabular ${highlight ? "text-foreground" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
