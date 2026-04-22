import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
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
      if (!Number.isFinite(n)) { setErrorMsg("resposta inválida"); setBalance(null); }
      else setBalance(n);
    } catch (e: any) {
      const raw = e?.message || "Falha";
      const friendly = raw.includes("Failed to fetch")
        ? "backend offline"
        : raw.includes("API respondeu HTML em vez de JSON")
          ? "backend/url da API inválido"
          : raw;
      setErrorMsg(friendly);
      setBalance(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin && onAdminRoute) load(); }, [isAdmin, onAdminRoute]);

  if (!isAdmin || !onAdminRoute) return null;

  return (
    <div className="border-b border-primary/15 bg-background/80 px-10 py-2 flex items-center justify-end gap-4 text-[11px] font-mono-x uppercase tracking-widest backdrop-blur">
      <span className="text-muted-foreground">Saldo</span>
      <span className={`tabular ${errorMsg ? "text-destructive" : "text-primary"}`}>
        {loading ? "···" : balance !== null ? `R$ ${balance.toFixed(2)}` : errorMsg ?? "—"}
      </span>
      <button onClick={load} className="text-muted-foreground hover:text-primary" title="Atualizar">
        <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
      </button>
    </div>
  );
}
