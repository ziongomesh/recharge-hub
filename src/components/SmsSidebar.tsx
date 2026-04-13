import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { operadorasApi, planosApi, type Operadora, type Plano } from "@/lib/api";
import { Search, Star } from "lucide-react";

interface ServiceItem {
  operadora: Operadora;
  minCost: number;
}

export default function SmsSidebar() {
  const [search, setSearch] = useState("");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const { operadoras } = await operadorasApi.list();
        const enabled = operadoras.filter((o) => o.enabled);
        const items: ServiceItem[] = [];

        for (const op of enabled) {
          try {
            const { planos } = await planosApi.listByOperadora(op.id);
            const minCost = planos.length > 0
              ? Math.min(...planos.map((p) => p.cost))
              : 0;
            items.push({ operadora: op, minCost });
          } catch {
            items.push({ operadora: op, minCost: 0 });
          }
        }

        setServices(items);
      } catch {
        setServices([
          { operadora: { id: 1, name: "Claro", enabled: true }, minCost: 0.50 },
          { operadora: { id: 2, name: "TIM", enabled: true }, minCost: 0.50 },
          { operadora: { id: 3, name: "Vivo", enabled: true }, minCost: 0.50 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  const filtered = services.filter((s) =>
    s.operadora.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="fixed left-0 top-0 h-screen flex flex-col bg-card border-r border-border z-30" style={{ width: "240px" }}>
      {/* Header */}
      <div className="bg-primary px-4 py-3">
        <h2 className="text-sm font-semibold text-primary-foreground">Lista de serviços</h2>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Services list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Nenhum serviço encontrado</div>
        ) : (
          filtered.map((s) => (
            <div
              key={s.operadora.id}
              className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{s.operadora.name}</span>
                <Star size={12} className="text-muted-foreground" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                R$ {s.minCost.toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
