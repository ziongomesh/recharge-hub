import { useEffect, useState } from "react";
import { adminApi, type ActivityLog } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ACTION_TYPES = [
  "all", "login", "register", "detect_operator", "check_phone",
  "recarga_created", "recarga_failed", "deposit", "refund", "admin_action",
];

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("action", filter);
    if (search) params.set("search", search);
    adminApi.logs(params.toString()).then((r) => setLogs(r.logs)).catch(() => {}).finally(() => setLoading(false));
  }, [filter, search]);

  return (
    <div>
      <h1 className="text-lg font-semibold mb-6">Logs de Atividade</h1>
      <div className="flex gap-3 mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t === "all" ? "Todos" : t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum log</TableCell></TableRow>
              ) : logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{new Date(l.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-sm">{l.username || `#${l.user_id}`}</TableCell>
                  <TableCell><span className="status-badge status-pending">{l.action}</span></TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{l.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
