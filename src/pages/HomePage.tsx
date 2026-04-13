import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { operadorasApi, planosApi, type Operadora } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Zap, Shield, Clock } from "lucide-react";
import cometaImg from "@/assets/cometa.png";
import phoneMockup from "@/assets/phone-mockup.webp";
import AuthModal from "@/components/AuthModal";

interface ServiceItem {
  operadora: Operadora;
  minCost: number;
  planoCount: number;
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Auth modal state based on route
  const isLoginRoute = location.pathname === "/login";
  const isRegisterRoute = location.pathname === "/register";
  const showAuthModal = isLoginRoute || isRegisterRoute;

  useEffect(() => {
    const load = async () => {
      try {
        const { operadoras } = await operadorasApi.list();
        const enabled = operadoras.filter((o) => o.enabled);
        const items: ServiceItem[] = [];
        for (const op of enabled) {
          try {
            const { planos } = await planosApi.listByOperadora(op.id);
            const minCost = planos.length > 0 ? Math.min(...planos.map((p) => p.cost)) : 0;
            items.push({ operadora: op, minCost, planoCount: planos.length });
          } catch {
            items.push({ operadora: op, minCost: 0, planoCount: 0 });
          }
        }
        setServices(items);
      } catch {
        setServices([
          { operadora: { id: 1, name: "Claro", enabled: true }, minCost: 0.50, planoCount: 4 },
          { operadora: { id: 2, name: "TIM", enabled: true }, minCost: 0.50, planoCount: 4 },
          { operadora: { id: 3, name: "Vivo", enabled: true }, minCost: 0.50, planoCount: 4 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = services.filter((s) =>
    s.operadora.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))" }}>
      {/* Top Nav */}
      <header className="w-full px-6 py-3 flex items-center justify-between border-b border-border/30 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src={cometaImg} alt="CometaSMS" className="w-7 h-7" />
            <span className="text-lg font-bold" style={{ color: "hsl(var(--primary))" }}>CometaSMS</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="default" size="sm" className="text-xs" onClick={() => user ? navigate("/recargas") : navigate("/login")}>
              Recargas
            </Button>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">SMS</Button>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">eSIM</Button>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">API</Button>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.username}</span>
              <Button size="sm" variant="outline" onClick={() => navigate("/recargas")}>
                Painel
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => navigate("/login")}>
              Entrar
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left Sidebar - Services */}
        <aside className="w-[260px] flex-shrink-0 border-r border-border/30 flex flex-col hidden lg:flex">
          <div className="p-3 border-b border-border/30">
            <h3 className="text-xs font-semibold text-foreground mb-2">Escolha a operadora</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por serviço"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-secondary/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Carregando...</div>
            ) : (
              filtered.map((s) => (
                <div
                  key={s.operadora.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-border/20 hover:bg-accent/30 transition-colors cursor-pointer group"
                  onClick={() => user ? navigate(`/recargas?operadora=${s.operadora.id}`) : navigate("/login")}
                >
                  <div>
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {s.operadora.name}
                    </span>
                    <p className="text-[11px] text-muted-foreground">{s.planoCount} planos disp.</p>
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    R$ {s.minCost.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Hero */}
        <main className="flex-1 relative overflow-hidden">
          <div
            className="absolute inset-0 star-field"
            style={{ background: "linear-gradient(160deg, hsl(270 30% 12%), hsl(260 25% 8%), hsl(270 20% 6%))" }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 px-8 lg:px-12 py-12 lg:py-16 h-full">
            {/* Text content */}
            <div className="flex-1 space-y-6">
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-foreground">
                Recargas instantâneas e{" "}
                <span style={{ color: "hsl(var(--primary))" }}>SMS virtual</span>
                {" "}com acesso via API
              </h1>

              <p className="text-base text-muted-foreground leading-relaxed max-w-lg">
                Recarregue créditos em qualquer operadora, receba SMS em números virtuais
                — utilize diretamente no site ou via API para registrar contas, verificar serviços e muito mais.
              </p>

              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <Zap size={16} className="mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
                  <span>Recargas processadas em segundos com confirmação automática via PIX</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Shield size={16} className="mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
                  <span>Operadoras Claro, TIM e Vivo disponíveis 24 horas por dia</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock size={16} className="mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
                  <span>Números virtuais para SMS com suporte a centenas de serviços</span>
                </li>
              </ul>

              <div className="flex gap-3 pt-2">
                {user ? (
                  <Button size="lg" onClick={() => navigate("/recargas")} className="animate-pulse-glow">
                    Fazer recarga
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                ) : (
                  <>
                    <Button size="lg" onClick={() => navigate("/register")} className="animate-pulse-glow">
                      Começar agora
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
                      Entrar
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Phone mockup */}
            <div className="flex-shrink-0 hidden lg:block">
              <img
                src={phoneMockup}
                alt="SMS Virtual"
                className="w-[280px] drop-shadow-2xl"
                style={{ filter: "drop-shadow(0 0 30px hsl(270 60% 40% / 0.3))" }}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-border/20 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex gap-4">
          <span>Sobre</span>
          <span>Privacidade</span>
          <span>API</span>
        </div>
        <span>CometaSMS © 2026</span>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={(open) => { if (!open) navigate("/"); }}
        initialMode={isRegisterRoute ? "register" : "login"}
      />
    </div>
  );
}
