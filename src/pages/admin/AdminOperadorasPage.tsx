import { useEffect, useState } from "react";
import { operadorasApi, planosApi, type Operadora, type Plano } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw, Wallet } from "lucide-react";

export default function AdminOperadorasPage() {
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);
  const [selected, setSelected] = useState<Operadora | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [newPlano, setNewPlano] = useState({ amount: "", cost: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [poekiBalance, setPoekiBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    loadOperadoras();
    loadPoekiBalance();
  }, []);

  const loadPoekiBalance = async () => {
    setLoadingBalance(true);
    try {
      const r: any = await planosApi.poekiBalance();
      const bal = r?.data?.balance ?? r?.balance ?? r?.data?.amount ?? null;
      setPoekiBalance(typeof bal === "number" ? bal : Number(bal) || 0);
    } catch {
      setPoekiBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Operadoras</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/40 text-sm">
            <Wallet size={14} className="text-primary" />
            <span className="text-muted-foreground">Saldo Poeki:</span>
            <span className="font-semibold">
              {loadingBalance ? "..." : poekiBalance !== null ? `R$ ${poekiBalance.toFixed(2)}` : "—"}
            </span>
            <button onClick={loadPoekiBalance} className="text-muted-foreground hover:text-primary" title="Atualizar">
              <RefreshCw size={12} className={loadingBalance ? "animate-spin" : ""} />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={syncCatalog} disabled={syncing}>
            <RefreshCw size={14} className={`mr-1 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar Poeki"}
          </Button>
        </div>
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
            <CardTitle className="text-base">Planos — {selected.name}</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus size={14} className="mr-1" /> Adicionar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo plano — {selected.name}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Valor cobrado (R$)</Label>
                    <Input type="number" value={newPlano.amount} onChange={(e) => setNewPlano((p) => ({ ...p, amount: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Custo real (R$)</Label>
                    <Input type="number" value={newPlano.cost} onChange={(e) => setNewPlano((p) => ({ ...p, cost: e.target.value }))} />
                  </div>
                  <Button onClick={addPlano} className="w-full">Adicionar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Valor cobrado</TableHead>
                  <TableHead>Custo real</TableHead>
                  <TableHead>Lucro</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planos.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum plano</TableCell></TableRow>
                ) : planos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>R$ {p.amount.toFixed(2)}</TableCell>
                    <TableCell>R$ {p.cost.toFixed(2)}</TableCell>
                    <TableCell className="text-success">R$ {(p.amount - p.cost).toFixed(2)}</TableCell>
                    <TableCell>
                      <button onClick={() => deletePlano(p.id)} className="text-destructive hover:text-destructive/80">
                        <Trash2 size={14} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
