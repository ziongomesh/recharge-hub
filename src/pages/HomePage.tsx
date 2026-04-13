import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { operadorasApi, type Operadora } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageSquare, CreditCard, ArrowRight } from "lucide-react";
import cometaImg from "@/assets/cometa.png";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);

  useEffect(() => {
    operadorasApi.list().then((r) => setOperadoras(r.operadoras.filter((o) => o.enabled))).catch(() => {
      setOperadoras([
        { id: 1, name: "Claro", enabled: true },
        { id: 2, name: "TIM", enabled: true },
        { id: 3, name: "Vivo", enabled: true },
      ]);
    });
  }, []);

  const modules = [
    {
      id: "recargas",
      title: "Recargas de Créditos",
      description: "Recarregue celular de qualquer operadora instantaneamente via PIX",
      icon: RefreshCw,
      active: true,
    },
    {
      id: "sms",
      title: "SMS Virtual",
      description: "Envie e receba SMS com números virtuais descartáveis",
      icon: MessageSquare,
      active: false,
    },
    {
      id: "esim",
      title: "eSIM",
      description: "Compre chips virtuais eSIM para qualquer operadora do Brasil",
      icon: CreditCard,
      active: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col star-field" style={{ background: "linear-gradient(160deg, hsl(260 20% 5%), hsl(270 25% 9%), hsl(260 20% 6%))" }}>
      {/* Header */}
      <header className="w-full px-8 py-4 flex items-center justify-between z-40 border-b border-border/20">
        <div className="flex items-center gap-2">
          <img src={cometaImg} alt="CometaSMS" className="w-8 h-8" />
          <span className="text-xl font-bold" style={{ color: "hsl(var(--primary))" }}>CometaSMS</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">Olá, {user.username}</span>
              <Button size="sm" onClick={() => navigate("/recargas")}>
                Painel
                <ArrowRight size={14} className="ml-1" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link>
              <Button size="sm" onClick={() => navigate("/register")}>Criar conta</Button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-5xl w-full flex flex-col md:flex-row items-center gap-12">
          {/* Text */}
          <div className="flex-1 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
              Velocidade de um{" "}
              <span style={{ color: "hsl(var(--primary))" }}>cometa</span>,{" "}
              <br />
              alcance de uma{" "}
              <span style={{ color: "hsl(var(--primary))" }}>constelação</span>.
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Recargas, SMS e eSIM em um único lugar.
              Rápido, seguro e disponível 24 horas por dia.
            </p>
            <div className="flex gap-3 pt-2">
              {user ? (
                <Button size="lg" onClick={() => navigate("/recargas")} className="animate-pulse-glow">
                  Ir para Recargas
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

          {/* Comet image */}
          <div className="flex-shrink-0">
            <img
              src={cometaImg}
              alt="Cometa"
              className="w-56 h-56 md:w-72 md:h-72 animate-float"
              style={{ filter: "drop-shadow(0 0 40px hsl(270 80% 55% / 0.5))" }}
            />
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section className="px-8 pb-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-label text-center mb-6">Nossos serviços</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {modules.map((mod) => (
              <Card
                key={mod.id}
                className={`glow-card border-border/30 transition-all hover:scale-[1.03] ${
                  !mod.active ? "opacity-50" : ""
                }`}
                style={{ background: "hsl(var(--card))" }}
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "hsl(var(--primary) / 0.12)" }}
                  >
                    <mod.icon size={26} style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{mod.title}</h3>
                    <p className="text-xs mt-1.5 text-muted-foreground leading-relaxed">{mod.description}</p>
                  </div>
                  {!mod.active && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                      style={{
                        background: "hsl(var(--primary) / 0.1)",
                        color: "hsl(var(--primary))",
                        border: "1px solid hsl(var(--primary) / 0.2)",
                      }}
                    >
                      Em breve
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Operadoras */}
      <section className="px-8 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-label text-center mb-6">Operadoras disponíveis</h2>
          <div className="flex justify-center gap-5">
            {operadoras.map((op) => (
              <div
                key={op.id}
                className="operator-card min-w-[140px] items-center text-center"
                onClick={() => user ? navigate(`/recargas?operadora=${op.id}`) : navigate("/login")}
              >
                <span className="font-bold text-foreground text-lg">{op.name}</span>
                <span className="text-xs text-muted-foreground">Disponível</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-5 text-xs text-muted-foreground border-t border-border/20">
        CometaSMS © 2026 — Todos os direitos reservados.
      </footer>
    </div>
  );
}
