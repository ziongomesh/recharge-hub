import { useEffect, useState } from "react";
import { operadorasApi, planosApi, type Operadora, type Plano } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, RefreshCw, Percent, Check } from "lucide-react";

export default function AdminOperadorasPage() {
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);
  const [selected, setSelected] = useState<Operadora | null>(null);
  const [allPlanos, setAllPlanos] = useState<Plano[]>([]);
  const [editing, setEditing] = useState<Record<number, string>>({});
  const [markupOpen, setMarkupOpen] = useState(false);
  const [markupPct, setMarkupPct] = useState("30");
  const [syncing, setSyncing] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [poekiStatus, setPoekiStatus] = useState<{ operator: string; enabled: boolean }[] | null>(null);
  const [poekiKeyTail, setPoekiKeyTail] = useState<string>("");
  const [poekiError, setPoekiError] = useState<string | null>(null);

  useEffect(() => { loadOperadoras(); loadAllPlanos(); loadPoekiStatus(); }, []);

  const loadPoekiStatus = async () => {
    try {
      const r = await operadorasApi.poekiStatus();
      setPoekiStatus(r.poeki);
      setPoekiKeyTail(r.key_tail);
      setPoekiError(null);
    } catch (e: any) {
      setPoekiStatus([]);
      setPoekiError(e?.message || "Erro ao consultar API de Recargas");
    }
  };

  const loadOperadoras = () => {
    operadorasApi.list().then((r) => setOperadoras(r.operadoras)).catch(() => setOperadoras([]));
  };

  const loadAllPlanos = async () => {
    setLoadingAll(true);
    try {
      const r = await planosApi.listAll();
      setAllPlanos(r.planos);
    } catch { setAllPlanos([]); } finally { setLoadingAll(false); }
  };

  const toggleEnabled = async (op: Operadora) => {
    if (!op.enabled && !op.poeki_allowed) {
      toast.error("Operadora não autorizada pela sua chave da API. Sincronize primeiro.");
      return;
    }
    try {
      await operadorasApi.update(op.id, { enabled: !op.enabled });
      setOperadoras((prev) => prev.map((o) => o.id === op.id ? { ...o, enabled: !o.enabled } : o));
      toast.success(`${op.name} ${!op.enabled ? "ativada" : "desativada"}`);
    } catch (e: any) { toast.error(e?.message || "Erro ao atualizar"); }
  };

  const savePrice = async (plano: Plano) => {
    const newAmount = Number(editing[plano.id]);
    if (!Number.isFinite(newAmount) || newAmount <= 0) { toast.error("Preço inválido"); return; }
    try {
      await planosApi.update(plano.id, { amount: newAmount });
      setAllPlanos((prev) => prev.map((p) => p.id === plano.id ? { ...p, amount: newAmount } : p));
      setEditing((prev) => { const n = { ...prev }; delete n[plano.id]; return n; });
      toast.success("Preço atualizado");
    } catch { toast.error("Erro ao salvar"); }
  };

  const syncCatalog = async () => {
    setSyncing(true);
    try {
      const op: any = await operadorasApi.sync();
      console.log("[Sync Operadoras] resposta:", op);
      if (op.poeki_raw) console.log("[Sync Operadoras] poeki_raw:", op.poeki_raw);
      if (op.poeki_allowed) console.log("[Sync Operadoras] autorizadas:", op.poeki_allowed);

      const pl: any = await planosApi.sync();
      console.log("[Sync Planos] resposta:", pl);

      toast.success(`${op.message} · ${pl.message}`, {
        description: `Autorizadas: ${(op.poeki_allowed || []).join(", ") || "nenhuma"}`,
        duration: 8000,
      });
      loadOperadoras();
      loadAllPlanos();
      loadPoekiStatus();
    } catch (e: any) {
      console.error("[Sync] erro:", e);
      toast.error(e?.message || "Erro ao sincronizar");
    } finally { setSyncing(false); }
  };

  const applyMarkup = async () => {
    const pct = Number(markupPct);
    if (!Number.isFinite(pct)) { toast.error("Percentual inválido"); return; }
    try {
      const r = await planosApi.markup(selected ? { operadora_id: selected.id, percent: pct } : { percent: pct });
      toast.success(r.message);
      setMarkupOpen(false);
      loadAllPlanos();
    } catch { toast.error("Erro ao aplicar markup"); }
  };

  const grouped = operadoras.map((op) => ({
    op,
    planos: allPlanos.filter((p) => p.operadora_id === op.id).sort((a, b) => a.amount - b.amount),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Operadoras & Planos</h1>
        <div className="flex gap-2">
          <Dialog open={markupOpen} onOpenChange={setMarkupOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Percent size={14} className="mr-1" /> Markup</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Markup global</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Aplica % sobre o custo da API em <strong>{selected ? selected.name : "TODAS as operadoras"}</strong>.
                </p>
                <div className="space-y-2">
                  <Label>Percentual (%)</Label>
                  <Input type="number" value={markupPct} onChange={(e) => setMarkupPct(e.target.value)} />
                </div>
              </div>
              <DialogFooter><Button onClick={applyMarkup}>Aplicar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={syncCatalog} disabled={syncing}>
            <RefreshCw size={14} className={`mr-1 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar API"}
          </Button>
        </div>
      </div>


      {/* Comparativo lado a lado: API de Recargas vs. Sistema local */}
      <Card className="mb-6">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>
              Status do Provedor <span className="text-muted-foreground font-normal">(chave …{poekiKeyTail || "?"})</span>
            </span>
            <button onClick={loadPoekiStatus} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <RefreshCw size={12} /> Atualizar
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {poekiError && (
            <p className="text-xs text-destructive mb-2">Erro ao consultar provedor: {poekiError}</p>
          )}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-2">Provedor retorna</div>
              {poekiStatus === null ? (
                <p className="text-xs text-muted-foreground">Carregando…</p>
              ) : poekiStatus.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma operadora retornada</p>
              ) : (
                <ul className="space-y-1.5">
                  {poekiStatus.map((p) => (
                    <li key={p.operator} className="flex items-center justify-between text-sm">
                      <span className="font-mono">{p.operator}</span>
                      <span className={`text-[10px] uppercase tracking-widest font-mono px-1.5 py-0.5 border ${p.enabled ? "text-success border-success/40" : "text-muted-foreground border-border"}`}>
                        {p.enabled ? "ativa" : "inativa"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-2">No sistema (local)</div>
              {operadoras.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma operadora cadastrada</p>
              ) : (
                <ul className="space-y-1.5">
                  {operadoras.map((op) => {
                    const inPoeki = poekiStatus?.find((p) => p.operator === op.name.toLowerCase().trim());
                    const mismatch = inPoeki && inPoeki.enabled && !op.enabled;
                    return (
                      <li key={op.id} className="flex items-center justify-between text-sm">
                        <span className="font-mono flex items-center gap-2">
                          {op.name.toLowerCase()}
                          {mismatch && <span className="text-[9px] uppercase text-warning">divergente</span>}
                        </span>
                        <span className={`text-[10px] uppercase tracking-widest font-mono px-1.5 py-0.5 border ${op.enabled ? "text-success border-success/40" : "text-muted-foreground border-border"}`}>
                          {op.enabled ? "ativa" : "inativa"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {operadoras.map((op) => {
          const allowed = !!op.poeki_allowed;
          return (
            <Card key={op.id} className={`${selected?.id === op.id ? "ring-1 ring-primary" : ""} ${!allowed ? "opacity-60" : ""}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <button
                  onClick={() => setSelected(selected?.id === op.id ? null : op)}
                  className="font-semibold flex items-center gap-2"
                  title={allowed ? "" : "Não autorizada pela API"}
                >
                  {op.name}
                  {!allowed && (
                    <span className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground border border-border px-1.5 py-0.5">
                      sem acesso
                    </span>
                  )}
                </button>
                <Switch
                  checked={op.enabled}
                  onCheckedChange={() => toggleEnabled(op)}
                  disabled={!allowed && !op.enabled}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {selected
          ? `Filtrando: ${selected.name}. Clique de novo para ver todas.`
          : "Apenas operadoras autorizadas pela sua chave da API podem ser ativadas. Use 'Sincronizar API' para atualizar a lista."}
      </p>

      {loadingAll ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="space-y-6">
          {grouped.filter(({ op }) => !selected || selected.id === op.id).map(({ op, planos: ps }) => (
            <Card key={op.id}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">{op.name} <span className="text-muted-foreground font-normal">({ps.length} planos)</span></CardTitle>
              </CardHeader>
              <CardContent>
                {ps.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum plano. Sincronize com a API.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Custo API</TableHead>
                        <TableHead>Preço cliente</TableHead>
                        <TableHead>Lucro</TableHead>
                        <TableHead>Margem</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ps.map((p) => {
                        const editVal = editing[p.id];
                        const profit = p.amount - p.cost;
                        const margin = p.cost > 0 ? (profit / p.cost) * 100 : 0;
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono text-muted-foreground">R$ {p.cost.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-8 w-24"
                                  value={editVal !== undefined ? editVal : p.amount.toFixed(2)}
                                  onChange={(e) => setEditing((prev) => ({ ...prev, [p.id]: e.target.value }))}
                                />
                                {editVal !== undefined && (
                                  <button onClick={() => savePrice(p)} className="text-success hover:text-success/80" title="Salvar">
                                    <Check size={16} />
                                  </button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className={profit >= 0 ? "text-success" : "text-destructive"}>R$ {profit.toFixed(2)}</TableCell>
                            <TableCell className={margin >= 0 ? "text-success" : "text-destructive"}>{margin.toFixed(1)}%</TableCell>
                            <TableCell>
                              <button onClick={async () => {
                                try { await planosApi.delete(p.id); setAllPlanos((prev) => prev.filter((x) => x.id !== p.id)); toast.success("Removido"); }
                                catch { toast.error("Erro ao remover"); }
                              }} className="text-destructive hover:text-destructive/80">
                                <Trash2 size={14} />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
