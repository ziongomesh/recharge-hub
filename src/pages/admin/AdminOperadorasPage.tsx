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

  useEffect(() => { loadOperadoras(); loadAllPlanos(); }, []);

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
    try {
      await operadorasApi.update(op.id, { enabled: !op.enabled });
      setOperadoras((prev) => prev.map((o) => o.id === op.id ? { ...o, enabled: !o.enabled } : o));
      toast.success(`${op.name} ${!op.enabled ? "ativada" : "desativada"}`);
    } catch { toast.error("Erro ao atualizar"); }
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
    try { const r = await planosApi.sync(); toast.success(r.message); loadAllPlanos(); }
    catch { toast.error("Erro ao sincronizar"); }
    finally { setSyncing(false); }
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
                  Aplica % sobre o custo Poeki em <strong>{selected ? selected.name : "TODAS as operadoras"}</strong>.
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
            {syncing ? "Sincronizando..." : "Sincronizar Poeki"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {operadoras.map((op) => (
          <Card key={op.id} className={selected?.id === op.id ? "ring-1 ring-primary" : ""}>
            <CardContent className="p-4 flex items-center justify-between">
              <button onClick={() => setSelected(selected?.id === op.id ? null : op)} className="font-semibold">
                {op.name}
              </button>
              <Switch checked={op.enabled} onCheckedChange={() => toggleEnabled(op)} />
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {selected ? `Filtrando: ${selected.name}. Clique de novo para ver todas.` : "Mostrando todas as operadoras. Clique numa operadora para filtrar. Custo Poeki = API. Preço cliente = editável."}
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
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum plano. Sincronize com a Poeki.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Custo Poeki</TableHead>
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
