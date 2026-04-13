import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { operadorasApi, type Operadora } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, MessageSquare, Sim } from "lucide-react";
import cometaImg from "@/assets/cometa.png";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);

  useEffect(() => {
    operadorasApi
      .list()
      .then((r) => setOperadoras(r.operadoras.filter((o) => o.enabled)))
      .catch(() => {
        setOperadoras([
          { id: 1, name: "Claro", enabled: true },
          { id: 2, name: "TIM", enabled: true },
          { id: 3, name: "Vivo", enabled: true },
        ]);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))" }}>
      {/* Header */}
      <header className="w-full px-6 py-3 flex items-center justify-between border-b border-border/30 z-40">
        <div className="flex items-center gap-2">
          <img src={cometaImg} alt="CometaSMS" className="w-7 h-7" />
          <span className="text-lg font-bold" style={{ color: "hsl(var(--primary))" }}>CometaSMS</span>
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
            <>
              <Button size="sm" variant="ghost" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Criar conta
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 star-field"
          style={{ background: "linear-gradient(160deg, hsl(270 30% 12%), hsl(260 25% 8%), hsl(270 20% 6%))" }}
        />

        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-10 max-w-3xl mx-auto">
          <img
            src={cometaImg}
            alt="Cometa"
            className="w-32 h-32 mb-8 animate-float"
            style={{ filter: "drop-shadow(0 0 40px hsl(270 80% 55% / 0.5))" }}
          />

          <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-foreground mb-4">
            Velocidade de um{" "}
            <span style={{ color: "hsl(var(--primary))" }}>cometa</span>,{" "}
            alcance de uma constelação
          </h1>

          <p className="text-base text-muted-foreground max-w-lg mb-8">
            Recarregue créditos, envie SMS com números virtuais e adquira eSIMs.
            Tudo via PIX, com confirmação automática e disponível 24h.
          </p>

          <div className="flex gap-3 mb-16">
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

          {/* Modules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mb-12">
            <div
              className="glow-card rounded-xl p-5 cursor-pointer transition-transform hover:scale-105"
              style={{ background: "hsl(var(--card))" }}
              onClick={() => (user ? navigate("/recargas") : navigate("/login"))}
            >
              <Smartphone size={28} className="mb-3" style={{ color: "hsl(var(--primary))" }} />
              <h3 className="font-semibold text-foreground mb-1">Recargas de Créditos</h3>
              <p className="text-xs text-muted-foreground">Claro, TIM, Vivo e mais</p>
            </div>

            <div
              className="rounded-xl p-5 opacity-60"
              style={{ background: "hsl(var(--card))" }}
            >
              <MessageSquare size={28} className="mb-3 text-muted-foreground" />
              <h3 className="font-semibold text-foreground mb-1">SMS Virtual</h3>
              <p className="text-xs text-muted-foreground">Em breve</p>
            </div>

            <div
              className="rounded-xl p-5 opacity-60"
              style={{ background: "hsl(var(--card))" }}
            >
              <Sim size={28} className="mb-3 text-muted-foreground" />
              <h3 className="font-semibold text-foreground mb-1">eSIM</h3>
              <p className="text-xs text-muted-foreground">Em breve</p>
            </div>
          </div>

          {/* Operadoras */}
          {operadoras.length > 0 && (
            <div className="w-full max-w-md">
              <h2 className="text-sm font-semibold text-foreground mb-3">Operadoras disponíveis</h2>
              <div className="flex gap-3 justify-center">
                {operadoras.map((op) => (
                  <div
                    key={op.id}
                    className="operator-card items-center px-6 py-3 cursor-pointer"
                    onClick={() => (user ? navigate(`/recargas?operadora=${op.id}`) : navigate("/login"))}
                  >
                    <span className="font-semibold text-foreground text-sm">{op.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-border/20 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex gap-4">
          <span>Sobre</span>
          <span>Privacidade</span>
          <span>API</span>
        </div>
        <span>CometaSMS © 2026 — Todos os direitos reservados.</span>
      </footer>
    </div>
  );
}
