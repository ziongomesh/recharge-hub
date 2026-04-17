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
import { Plus, Trash2, RefreshCw, Percent, Check } from "lucide-react";

export default function AdminOperadorasPage() {
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);
  const [selected, setSelected] = useState<Operadora | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [editing, setEditing] = useState<Record<number, string>>({});
  const [newPlano, setNewPlano] = useState({ amount: "", cost: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [markupOpen, setMarkupOpen] = useState(false);
  const [markupPct, setMarkupPct] = useState("30");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { loadOperadoras(); }, []);

  const loadOperadoras = () => {
    operadorasApi.list().then((r) => setOperadoras(r.operadoras)).catch(() => {
      setOperadoras([
        { id: 1, name: "Claro", enabled: true },
        { id: 2, name: "TIM", enabled: true },
        { id: 3, name: "Vivo", enabled: true },
      ]);
    });
  };

  const toggleEnabled = async (op: Operadora) => {
    try {
      await operadorasApi.update(op.id, { enabled: !op.enabled });
      setOperadoras((prev) => prev.map((o) => o.id === op.id ? { ...o, enabled: !o.enabled } : o));
      toast.success(`${op.name} ${!op.enabled ? "ativada" : "desativada"}`);
    } catch { toast.error("Erro ao atualizar"); }
  };

  const selectOperadora = async (op: Operadora) => {
    setSelected(op);
    setEditing({});
    try {
      const r = await planosApi.listByOperadora(op.id);
      setPlanos(r.planos);
    } catch { setPlanos([]); }
  };

  const syncCatalog = async () => {
    setSyncing(true);
    try {
      const result = await planosApi.sync();
      toast.success(result.message);
      if (selected) selectOperadora(selected);
    } catch {
      toast.error("Erro ao sincronizar catálogo");
    } finally {
      setSyncing(false);
    }
  };

  const addPlano = async () => {
    if (!selected || !newPlano.amount || !newPlano.cost) return;
    try {
      await planosApi.create({ operadora_id: selected.id, amount: Number(newPlano.amount), cost: Number(newPlano.cost) });
      setNewPlano({ amount: "", cost: "" });
      setDialogOpen(false);
      selectOperadora(selected);
      toast.success("Plano adicionado");
    } catch { toast.error("Erro ao adicionar plano"); }
  };

  const deletePlano = async (id: number) => {
    try {
      await planosApi.delete(id);
      setPlanos((prev) => prev.filter((p) => p.id !== id));
      toast.success("Plano removido");
    } catch { toast.error("Erro ao remover"); }
  };

  const savePrice = async (plano: Plano) => {
    const raw = editing[plano.id];
    const newAmount = Number(raw);
    if (!Number.isFinite(newAmount) || newAmount <= 0) {
      toast.error("Preço inválido");
      return;
    }
    try {
      await planosApi.update(plano.id, { amount: newAmount });
      setPlanos((prev) => prev.map((p) => p.id === plano.id ? { ...p, amount: newAmount } : p));
      setEditing((prev) => { const n = { ...prev }; delete n[plano.id]; return n; });
      toast.success("Preço atualizado");
    } catch { toast.error("Erro ao salvar"); }
  };

  const applyMarkup = async () => {
    if (!selected) return;
    const pct = Number(markupPct);
    if (!Number.isFinite(pct)) { toast.error("Percentual inválido"); return; }
    try {
      const r = await planosApi.markup({ operadora_id: selected.id, percent: pct });
      toast.success(r.message);
      setMarkupOpen(false);
      selectOperadora(selected);
    } catch { toast.error("Erro ao aplicar markup"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Operadoras & Planos</h1>
        <Button variant="outline" size="sm" onClick={syncCatalog} disabled={syncing}>
          <RefreshCw size={14} className={`mr-1 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando..." : "Sincronizar Poeki"}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {operadoras.map((op) => (
          <Card key={op.id} className={`cursor-pointer ${selected?.id === op.id ? "ring-1 ring-primary" : ""}`} onClick={() => selectOperadora(op)}>
            <CardContent className="p-4 flex items-center justify-between">
              <span className="font-semibold">{op.name}</span>
              <Switch checked={op.enabled} onCheckedChange={() => toggleEnabled(op)} onClick={(e) => e.stopPropagation()} />
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Planos — {selected.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Custo Poeki é o valor cobrado pela API. Preço cliente é editável e define o que o usuário paga.
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={markupOpen} onOpenChange={setMarkupOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Percent size={14} className="mr-1" /> Markup</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Markup global — {selected.name}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Aplica um percentual sobre o custo Poeki. Ex: custo R$7 + 30% = preço R$9,10.
                    </p>
                    <div className="space-y-2">
                      <Label>Percentual (%)</Label>
                      <Input type="number" value={markupPct} onChange={(e) => setMarkupPct(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={applyMarkup}>Aplicar a todos os planos</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus size={14} className="mr-1" /> Adicionar</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo plano — {selected.name}</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Preço cliente (R$)</Label>
                      <Input type="number" value={newPlano.amount} onChange={(e) => setNewPlano((p) => ({ ...p, amount: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Custo Poeki (R$)</Label>
                      <Input type="number" value={newPlano.cost} onChange={(e) => setNewPlano((p) => ({ ...p, cost: e.target.value }))} />
                    </div>
                    <Button onClick={addPlano} className="w-full">Adicionar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
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
                {planos.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum plano. Sincronize com a Poeki.</TableCell></TableRow>
                ) : planos.map((p) => {
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
                      <TableCell className={profit >= 0 ? "text-success" : "text-destructive"}>
                        R$ {profit.toFixed(2)}
                      </TableCell>
                      <TableCell className={margin >= 0 ? "text-success" : "text-destructive"}>
                        {margin.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <button onClick={() => deletePlano(p.id)} className="text-destructive hover:text-destructive/80">
                          <Trash2 size={14} />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
