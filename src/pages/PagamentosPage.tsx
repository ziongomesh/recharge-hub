import { useState, useEffect, useRef } from "react";
import { pagamentosApi, type Pagamento } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Copy, CheckCircle } from "lucide-react";

export default function PagamentosPage() {
  const { refreshUser } = useAuth();
  const [tab, setTab] = useState<"depositar" | "historico">("depositar");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ qrCodeBase64: string; pixCopiaECola: string; txId: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

  useEffect(() => {
    if (tab === "historico") {
      pagamentosApi.list().then((r) => setPagamentos(r.pagamentos)).catch(() => {});
    }
  }, [tab]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleDeposit = async () => {
    const val = parseFloat(amount);
    if (!val || val < 1) { toast.error("Valor mínimo: R$ 1,00"); return; }
    setLoading(true);
    try {
      const res = await pagamentosApi.deposit(val);
      setPixData({ qrCodeBase64: res.qrCodeBase64, pixCopiaECola: res.pixCopiaECola, txId: res.pagamento.transaction_id });
      pollRef.current = setInterval(async () => {
        try {
          const status = await pagamentosApi.checkStatus(res.pagamento.transaction_id);
          if (status.status === "paid") {
            clearInterval(pollRef.current!);
            setConfirmed(true);
            await refreshUser();
            toast.success("Pagamento confirmado!");
          }
        } catch {}
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar PIX");
    } finally {
      setLoading(false);
    }
  };

  const copyPix = () => {
    if (pixData) {
      navigator.clipboard.writeText(pixData.pixCopiaECola);
      toast.success("Código PIX copiado!");
    }
  };

  const resetDeposit = () => {
    setPixData(null);
    setConfirmed(false);
    setAmount("");
    if (pollRef.current) clearInterval(pollRef.current);
  };

  return (
    <div>
      <h1 className="text-lg font-semibold mb-6">Pagamentos</h1>
      <div className="flex gap-2 mb-6">
        <Button variant={tab === "depositar" ? "default" : "outline"} size="sm" onClick={() => setTab("depositar")}>Depositar saldo</Button>
        <Button variant={tab === "historico" ? "default" : "outline"} size="sm" onClick={() => setTab("historico")}>Histórico</Button>
      </div>

      {tab === "depositar" && !pixData && !confirmed && (
        <Card className="max-w-sm">
          <CardHeader><CardTitle className="text-base">Depositar via PIX</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <Button onClick={handleDeposit} disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Gerar PIX
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "depositar" && pixData && !confirmed && (
        <Card className="max-w-sm">
          <CardHeader><CardTitle className="text-base">Pague o PIX</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-center">
            {pixData.qrCodeBase64 && (
              <img src={pixData.qrCodeBase64} alt="QR Code PIX" className="mx-auto w-48 h-48 rounded-lg border" />
            )}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Copia e cola</Label>
              <div className="flex gap-2">
                <Input value={pixData.pixCopiaECola} readOnly className="text-xs font-mono" />
                <Button variant="outline" size="icon" onClick={copyPix}><Copy size={16} /></Button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" size={14} />
              Aguardando pagamento...
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "depositar" && confirmed && (
        <Card className="max-w-sm">
          <CardContent className="py-8 text-center space-y-4">
            <CheckCircle className="mx-auto text-success" size={48} />
            <h2 className="text-lg font-semibold">Pagamento confirmado!</h2>
            <p className="text-sm text-muted-foreground">Seu saldo foi atualizado.</p>
            <Button onClick={resetDeposit} variant="outline">Novo depósito</Button>
          </CardContent>
        </Card>
      )}

      {tab === "historico" && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamentos.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nenhum pagamento</TableCell></TableRow>
              ) : pagamentos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-sm">R$ {p.amount.toFixed(2)}</TableCell>
                  <TableCell><span className={`status-badge status-${p.status}`}>{p.status === "paid" ? "Pago" : p.status === "pending" ? "Pendente" : "Falhou"}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
