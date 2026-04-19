import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, ArrowDownToLine, Zap, Activity, Wallet } from "lucide-react";
import PoekiBalanceHero from "@/components/PoekiBalanceHero";

const fmtBRL = (n: number) => `R$ ${Number(n || 0).toFixed(2)}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

export default function AdminDashboardPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.stats>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando estatísticas…</p>;
  if (!data) return <p className="text-sm text-destructive">Erro ao carregar.</p>;

  const t = data.totals;
  const maxVol = Math.max(...data.dailyVolume.map((d) => Number(d.volume) || 0), 1);

  return (
    <div className="space-y-8">
      <div>
        <div className="label-eyebrow">Dashboard</div>
        <h1 className="font-display text-4xl mt-1">Visão geral.</h1>
      </div>

      {/* Saldo API em destaque */}
      <PoekiBalanceHero />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Users} label="Usuários" value={Number(t.total_users)} sub={`+${Number(t.users_today)} hoje · +${Number(t.users_week)} 7d`} />
        <Kpi icon={Zap} label="Recargas (30d)" value={Number(t.recargas_month)} sub={`${Number(t.recargas_today)} hoje · ${Number(t.recargas_pendentes)} pendentes`} />
        <Kpi icon={TrendingUp} label="Volume 30d" value={fmtBRL(Number(t.volume_month))} sub={`Lucro: ${fmtBRL(Number(t.profit_month))}`} />
        <Kpi icon={ArrowDownToLine} label="Depósitos 30d" value={fmtBRL(Number(t.depositos_month))} sub={`${fmtBRL(Number(t.depositos_today))} hoje · ${Number(t.depositos_pendentes)} pendentes`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Kpi icon={Wallet} label="Saldo total clientes" value={fmtBRL(Number(t.total_balance))} />
        <Kpi icon={Activity} label="Recargas hoje" value={Number(t.recargas_today)} sub={fmtBRL(Number(t.volume_today))} />
        <Kpi icon={Activity} label="Recargas 7d" value={Number(t.recargas_week)} sub={fmtBRL(Number(t.volume_week))} />
      </div>

      {/* Status breakdown + por operadora */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Status das recargas</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.statusBreakdown.map((s) => (
                <div key={s.status} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{s.status}</span>
                  <span className="font-mono-x tabular">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Por operadora (30d)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.byOperadora.map((o) => (
                <div key={o.name} className="flex items-center justify-between text-sm">
                  <span>{o.name}</span>
                  <span className="font-mono-x tabular text-muted-foreground">{o.qtd} · {fmtBRL(Number(o.volume))}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Série diária 14d */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Volume diário (14 dias)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {data.dailyVolume.map((d) => {
              const h = (Number(d.volume) / maxVol) * 100;
              return (
                <div key={d.dia} className="flex-1 flex flex-col items-center gap-1" title={`${fmtDate(d.dia)} • ${fmtBRL(Number(d.volume))} • ${d.qtd} recargas`}>
                  <div className="w-full bg-foreground/80 rounded-t" style={{ height: `${Math.max(h, 2)}%` }} />
                  <div className="text-[9px] font-mono-x text-muted-foreground">{new Date(d.dia).getDate()}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tops */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Top recarregadores (30d)</CardTitle></CardHeader>
          <CardContent>
            {data.topRecarregadores.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum dado.</p> :
              <ol className="space-y-1.5 text-sm">
                {data.topRecarregadores.map((u, i) => (
                  <li key={u.id} className="flex items-center justify-between">
                    <Link to={`/admin/usuarios/${u.id}`} className="hover:underline truncate">
                      <span className="text-muted-foreground mr-2">{i+1}.</span>{u.username}
                    </Link>
                    <span className="font-mono-x tabular text-xs">{u.qtd}× · {fmtBRL(Number(u.total))}</span>
                  </li>
                ))}
              </ol>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Quem fez mais pedidos (30d)</CardTitle></CardHeader>
          <CardContent>
            {data.topPedidos.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum dado.</p> :
              <ol className="space-y-1.5 text-sm">
                {data.topPedidos.map((u, i) => (
                  <li key={u.id} className="flex items-center justify-between">
                    <Link to={`/admin/usuarios/${u.id}`} className="hover:underline truncate">
                      <span className="text-muted-foreground mr-2">{i+1}.</span>{u.username}
                    </Link>
                    <span className="font-mono-x tabular text-xs">{u.qtd} pedidos</span>
                  </li>
                ))}
              </ol>}
          </CardContent>
        </Card>
      </div>

      {/* Últimos cadastros */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Últimos cadastros (24h)</CardTitle></CardHeader>
        <CardContent>
          {data.latestUsers.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum cadastro nas últimas 24h.</p> :
            <ul className="divide-y divide-border">
              {data.latestUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2 text-sm">
                  <Link to={`/admin/usuarios/${u.id}`} className="hover:underline">{u.username} <span className="text-muted-foreground text-xs">· {u.email}</span></Link>
                  <span className="font-mono-x text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString("pt-BR")}</span>
                </li>
              ))}
            </ul>}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number | string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon size={13} /> {label}</div>
        <div className="font-display text-2xl mt-1 tabular">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}
