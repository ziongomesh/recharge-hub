import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi, type User } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, ExternalLink } from "lucide-react";

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [editingBalance, setEditingBalance] = useState<{ id: number; value: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
  }, [search]);

  const load = () => {
    setLoading(true);
    adminApi.users.list(search || undefined).then((r) => setUsers(r.users)).finally(() => setLoading(false));
  };

  const toggleRole = async (u: User) => {
    try {
      await adminApi.users.update(u.id, { role: u.role === "admin" ? "user" : "admin" });
      load();
      toast.success(`${u.username} agora é ${u.role === "admin" ? "user" : "admin"}`);
    } catch { toast.error("Erro"); }
  };

  const saveBalance = async (id: number) => {
    if (!editingBalance) return;
    try {
      await adminApi.users.update(id, { balance: Number(editingBalance.value) });
      setEditingBalance(null);
      load();
      toast.success("Saldo atualizado");
    } catch { toast.error("Erro"); }
  };

  const deleteUser = async (u: User) => {
    if (!confirm(`Excluir ${u.username}?`)) return;
    try {
      await adminApi.users.delete(u.id);
      load();
      toast.success("Usuário excluído");
    } catch { toast.error("Erro"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="label-eyebrow">Base</div>
        <h1 className="font-display text-4xl mt-1">Usuários.</h1>
        <p className="text-sm text-muted-foreground mt-1">{users.length} resultado(s) · Clique no nome para ver tudo do usuário</p>
      </div>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Busca</CardTitle></CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por usuário, email, telefone ou CPF…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Carregando…</TableCell></TableRow>}
              {!loading && users.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Nenhum usuário</TableCell></TableRow>}
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <Link to={`/admin/usuarios/${u.id}`} className="hover:underline inline-flex items-center gap-1">
                      {u.username} <ExternalLink size={11} className="text-muted-foreground" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell className="text-sm font-mono-x">{u.phone}</TableCell>
                  <TableCell>
                    {editingBalance?.id === u.id ? (
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          className="h-7 w-24 text-sm"
                          value={editingBalance.value}
                          onChange={(e) => setEditingBalance({ id: u.id, value: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && saveBalance(u.id)}
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => saveBalance(u.id)}>OK</Button>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer hover:text-primary text-sm font-mono-x tabular"
                        onClick={() => setEditingBalance({ id: u.id, value: u.balance.toFixed(2) })}
                      >
                        R$ {u.balance.toFixed(2)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleRole(u)}
                      className={`text-xs px-2 py-0.5 rounded border ${u.role === "admin" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}
                    >
                      {u.role}
                    </button>
                  </TableCell>
                  <TableCell className="text-xs font-mono-x text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => deleteUser(u)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 size={14} />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
