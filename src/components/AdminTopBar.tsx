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

  const isAdmin = user?.role === "admin";
  const onAdminRoute = location.pathname.startsWith("/admin");

  const load = async () => {
    setLoading(true);
    try {
      const r: any = await planosApi.poekiBalance();
      const bal = r?.data?.balance ?? r?.balance ?? r?.data?.amount ?? null;
      setBalance(typeof bal === "number" ? bal : Number(bal) || 0);
    } catch {
      setBalance(null);
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
      <div className="flex items-center gap-2 px-3 py-1 rounded-md border bg-background text-sm">
        <Wallet size={14} className="text-primary" />
        <span className="text-muted-foreground">Saldo API Poeki:</span>
        <span className="font-semibold">
          {loading ? "..." : balance !== null ? `R$ ${balance.toFixed(2)}` : "—"}
        </span>
        <button onClick={load} className="text-muted-foreground hover:text-primary ml-1" title="Atualizar">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
}
