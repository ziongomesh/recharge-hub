import { useEffect, useState } from "react";
import { adminApi, type User } from "@/lib/api";
import { Link } from "react-router-dom";
import { Shield, Crown, Clock } from "lucide-react";

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.users.staff().then((r) => setStaff(r.users)).finally(() => setLoading(false));
  }, []);

  const fmt = (d?: string | null) => d ? new Date(d).toLocaleString("pt-BR") : "—";
  const since = (d?: string | null) => {
    if (!d) return "nunca logou";
    const ms = Date.now() - new Date(d).getTime();
    const min = Math.floor(ms / 60000);
    if (min < 1) return "agora";
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h}h`;
    const days = Math.floor(h / 24);
    return `há ${days}d`;
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="label-eyebrow">Equipe</div>
        <h1 className="font-display text-4xl mt-1">Administradores & moderadores.</h1>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper-2 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Usuário</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Rank</th>
                <th className="text-left px-4 py-3">Último login</th>
                <th className="text-left px-4 py-3">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.map((u) => {
                const lastMs = u.last_login_at ? Date.now() - new Date(u.last_login_at).getTime() : Infinity;
                const online = lastMs < 5 * 60 * 1000;
                return (
                  <tr key={u.id} className="hover:bg-paper-2/50">
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                        u.role === "admin" ? "bg-foreground text-background" : "bg-paper-2 border border-border"
                      }`}>
                        {u.role === "admin" ? <Crown size={10} /> : <Shield size={10} />}
                        {u.role === "admin" ? "Admin" : "Moderador"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono-x text-xs">
                      <Clock size={10} className="inline mr-1 opacity-50" />
                      {fmt(u.last_login_at)}
                      <span className="text-muted-foreground ml-2">· {since(u.last_login_at)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${online ? "text-success" : "text-muted-foreground"}`}>
                        ● {online ? "online" : "offline"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/usuarios/${u.id}`} className="text-xs hover:underline">Detalhes →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
