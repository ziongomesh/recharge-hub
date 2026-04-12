import { useEffect, useState } from "react";
import { adminApi, type User } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingBalance, setEditingBalance] = useState<{ id: number; value: string } | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    adminApi.users.list().then((r) => setUsers(r.users)).catch(() => {});
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
    <div>
      <h1 className="text-lg font-semibold mb-6">Usuários</h1>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.username}</TableCell>
                <TableCell className="text-sm">{u.email}</TableCell>
                <TableCell className="text-sm font-mono">{u.phone}</TableCell>
                <TableCell>
                  {editingBalance?.id === u.id ? (
                    <div className="flex gap-1">
                      <Input
                        type="number"
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
                      className="cursor-pointer hover:text-primary text-sm"
                      onClick={() => setEditingBalance({ id: u.id, value: u.balance.toFixed(2) })}
                    >
                      R$ {u.balance.toFixed(2)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => toggleRole(u)}
                    className={`status-badge ${u.role === "admin" ? "status-confirmed" : "status-pending"} cursor-pointer`}
                  >
                    {u.role}
                  </button>
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
      </div>
    </div>
  );
}
