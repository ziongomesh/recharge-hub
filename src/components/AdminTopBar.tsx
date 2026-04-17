import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Wallet, RefreshCw } from "lucide-react";
import { planosApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminTopBar() {
  const { user } = useAuth();
  const location = useLocation();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";
  const onAdminRoute = location.pathname.startsWith("/admin");

  const load = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const r: any = await planosApi.poekiBalance();
      const bal = r?.data?.balance ?? r?.balance ?? r?.data?.amount ?? null;
      const n = typeof bal === "number" ? bal : Number(bal);
      if (!Number.isFinite(n)) {
        setErrorMsg("resposta inválida da API");
        setBalance(null);
      } else {
        setBalance(n);
      }
    } catch (e: any) {
      const rawMessage = e?.message || "Falha de conexão";
      const friendlyMessage = rawMessage.includes("Failed to fetch") ? "backend offline" : rawMessage;
      setBalance(null);
      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && onAdminRoute) load();
  }, [isAdmin, onAdminRoute]);

  if (!isAdmin || !onAdminRoute) return null;

  return (
    <div className="flex items-center justify-end gap-2 border-b border-border/50 px-8 py-2 bg-muted/30">
      <div className="flex items-center gap-2 px-3 py-1 rounded-md border bg-background text-sm" title={errorMsg || ""}>
        <Wallet size={14} className="text-primary" />
        <span className="text-muted-foreground">Saldo API Poeki:</span>
        <span className={`font-semibold ${errorMsg ? "text-destructive" : ""}`}>
          {loading ? "..." : balance !== null ? `R$ ${balance.toFixed(2)}` : errorMsg ? errorMsg : "—"}
        </span>
        <button onClick={load} className="text-muted-foreground hover:text-primary ml-1" title={errorMsg ? `Erro: ${errorMsg}` : "Atualizar"}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
}
